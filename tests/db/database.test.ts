/**
 * Integration tests against a real PostgreSQL running the real migrations.
 * Requires a local Postgres (see README "Running tests"). Skipped if absent.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { asUser, canConnect, createUser, resetDatabase } from "./helpers";
import { computeBudgetUsage } from "@/lib/finance";
import { filtersToDateRange } from "@/lib/filters";
import { monthRange } from "@/lib/dates";

const available = await canConnect();

describe.skipIf(!available)("database (real migrations)", () => {
  let db: Client;
  let alice: string;
  let bob: string;

  const q = async <T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    (await db.query<T>(sql, params)).rows;
  const as = <T>(uid: string | null, fn: () => Promise<T>) => asUser(db, uid, fn);

  const categoryId = async (uid: string, name: string) =>
    as(uid, async () => (await q<{ id: string }>("select id from categories where name = $1", [name]))[0].id);

  const addTx = (uid: string, type: "income" | "expense", amount: number, category: string, date = "2026-11-05", description = "tx") =>
    as(uid, async () =>
      (await q<{ id: string }>(
        "insert into transactions (type, description, amount, category_id, transaction_date) values ($1,$2,$3,$4,$5) returning id",
        [type, description, amount, category, date],
      ))[0].id,
    );

  const balance = (uid: string) => as(uid, async () => Number((await q<{ b: string }>("select current_balance() as b"))[0].b));
  const setInitial = (uid: string, v: number) => as(uid, () => q("update settings set initial_balance = $1", [v]));

  const pgError = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (e) {
      return e as { code: string; constraint?: string; message: string };
    }
    throw new Error("expected a database error");
  };

  let FOOD: string, SALARY: string, TRANSPORT: string;

  beforeAll(async () => {
    db = await resetDatabase();
    alice = await createUser(db, "alice@example.com");
    bob = await createUser(db, "bob@example.com");
    FOOD = await categoryId(alice, "Makanan & Minuman");
    SALARY = await categoryId(alice, "Gaji");
    TRANSPORT = await categoryId(alice, "Transportasi");
  });

  afterAll(async () => {
    await db?.end();
  });

  beforeEach(async () => {
    await as(alice, () => q("delete from budgets"));
    await as(alice, () => q("delete from transactions"));
    await setInitial(alice, 1_000_000);
  });

  describe("new user setup", () => {
    it("seeds profile, settings and 17 default categories", async () => {
      const cats = await as(bob, () => q<{ type: string }>("select type from categories"));
      expect(cats).toHaveLength(17);
      expect(cats.filter((c) => c.type === "income")).toHaveLength(6);
      const s = await as(bob, () => q<{ initial_balance: string; currency: string; timezone: string }>("select * from settings"));
      expect(s[0]).toMatchObject({ initial_balance: "0", currency: "IDR", timezone: "Asia/Makassar" });
      expect(await as(bob, () => q("select * from profiles"))).toHaveLength(1);
    });
    it("ensure_user_setup is idempotent", async () => {
      await as(bob, () => q("select ensure_user_setup()"));
      expect(await as(bob, () => q("select id from categories"))).toHaveLength(17);
      expect(await as(bob, () => q("select id from settings"))).toHaveLength(1);
    });
  });

  describe("balance scenarios", () => {
    it("1: income", async () => {
      await addTx(alice, "income", 500_000, SALARY);
      expect(await balance(alice)).toBe(1_500_000);
    });
    it("2: expense", async () => {
      await addTx(alice, "expense", 200_000, FOOD);
      expect(await balance(alice)).toBe(800_000);
    });
    it("3: multiple", async () => {
      await addTx(alice, "income", 500_000, SALARY);
      await addTx(alice, "income", 300_000, SALARY);
      await addTx(alice, "expense", 100_000, FOOD);
      await addTx(alice, "expense", 200_000, FOOD);
      expect(await balance(alice)).toBe(1_500_000);
    });
    it("4: edit", async () => {
      const id = await addTx(alice, "expense", 200_000, FOOD);
      await as(alice, () => q("update transactions set amount = 300000 where id = $1", [id]));
      expect(await balance(alice)).toBe(700_000);
    });
    it("5: delete", async () => {
      const id = await addTx(alice, "expense", 200_000, FOOD);
      await as(alice, () => q("delete from transactions where id = $1", [id]));
      expect(await balance(alice)).toBe(1_000_000);
    });
    it("changing the initial balance only shifts the balance", async () => {
      await addTx(alice, "expense", 200_000, FOOD);
      await setInitial(alice, 2_000_000);
      expect(await balance(alice)).toBe(1_800_000);
    });
    it("empty history: totals are 0 and balance = initial", async () => {
      const t = await as(alice, () => q("select * from transaction_totals()"));
      expect(t[0]).toEqual({ total_income: "0", total_expense: "0", transaction_count: "0" });
      expect(await balance(alice)).toBe(1_000_000);
      expect(await as(alice, () => q("select * from search_transactions()"))).toHaveLength(0);
    });
    it("editing transaction type to income moves it to the other side", async () => {
      const id = await addTx(alice, "expense", 200_000, FOOD);
      await as(alice, () => q("update transactions set type = 'income', category_id = $2 where id = $1", [id, SALARY]));
      expect(await balance(alice)).toBe(1_200_000);
    });
  });

  describe("constraints", () => {
    it.each([0, -1000])("rejects amount %i", async (amount) => {
      const e = await pgError(addTx(alice, "expense", amount, FOOD));
      expect(e.code).toBe("23514");
    });
    it("rejects an expense with an income category", async () => {
      const e = await pgError(addTx(alice, "expense", 1000, SALARY));
      expect(e.code).toBe("23503");
    });
    it("rejects a category of another user", async () => {
      const bobFood = await categoryId(bob, "Makanan & Minuman");
      const e = await pgError(addTx(alice, "expense", 1000, bobFood));
      expect(e.code).toBe("23503");
    });
    it("prevents duplicate monthly budgets", async () => {
      await as(alice, () => q("insert into budgets (category_id, month, year, amount) values ($1, 11, 2026, 1000000)", [FOOD]));
      const e = await pgError(as(alice, () => q("insert into budgets (category_id, month, year, amount) values ($1, 11, 2026, 5)", [FOOD])));
      expect(e.code).toBe("23505");
      expect(e.constraint).toBe("budgets_unique_category_month");
      // same category, another month is fine
      await as(alice, () => q("insert into budgets (category_id, month, year, amount) values ($1, 12, 2026, 1000000)", [FOOD]));
    });
    it("rejects budgets on income categories", async () => {
      const e = await pgError(as(alice, () => q("insert into budgets (category_id, month, year, amount) values ($1, 11, 2026, 1000)", [SALARY])));
      expect(e.code).toBe("23503");
    });
    it("rejects duplicate category names (case-insensitive) per type", async () => {
      const e = await pgError(as(alice, () => q("insert into categories (name, type) values (' makanan & minuman ', 'expense')")));
      expect(e.code).toBe("23505");
    });
    it("blocks deleting a category in use, and changing its type", async () => {
      await addTx(alice, "expense", 1000, TRANSPORT);
      expect((await pgError(as(alice, () => q("delete from categories where id = $1", [TRANSPORT])))).code).toBe("23503");
      expect((await pgError(as(alice, () => q("update categories set type = 'income' where id = $1", [TRANSPORT])))).code).toBe("23503");
    });
    it("reassign_and_delete_category moves transactions atomically", async () => {
      const [tmp] = await as(alice, () => q<{ id: string }>("insert into categories (name, type, icon) values ('Kopi', 'expense', 'coffee') returning id"));
      await addTx(alice, "expense", 15_000, tmp.id);
      await addTx(alice, "expense", 20_000, tmp.id);
      await as(alice, () => q("insert into budgets (category_id, month, year, amount) values ($1, 11, 2026, 100000)", [tmp.id]));
      const before = await balance(alice);
      const [{ moved }] = await as(alice, () => q<{ moved: number }>("select reassign_and_delete_category($1, $2) as moved", [tmp.id, FOOD]));
      expect(moved).toBe(2);
      expect(await balance(alice)).toBe(before);
      expect(await as(alice, () => q("select 1 from categories where id = $1", [tmp.id]))).toHaveLength(0);
      expect(await as(alice, () => q("select 1 from transactions where category_id = $1", [FOOD]))).toHaveLength(2);
    });
    it("reassign rejects a target of the other type (and changes nothing)", async () => {
      const [tmp] = await as(alice, () => q<{ id: string }>("insert into categories (name, type) values ('Snack', 'expense') returning id"));
      await addTx(alice, "expense", 5_000, tmp.id);
      const e = await pgError(as(alice, () => q("select reassign_and_delete_category($1, $2)", [tmp.id, SALARY])));
      expect(e.code).toBe("23503");
      expect(await as(alice, () => q("select 1 from categories where id = $1", [tmp.id]))).toHaveLength(1);
      await as(alice, () => q("delete from transactions where category_id = $1", [tmp.id]));
      await as(alice, () => q("delete from categories where id = $1", [tmp.id]));
    });
  });

  describe("bills & installments (record keeping)", () => {
    const q1 = async <T extends Record<string, unknown>>(uid: string, sql: string, params: unknown[] = []) => (await as(uid, () => q<T>(sql, params)))[0];
    let bill: string;
    let inst: string;

    beforeEach(async () => {
      await as(alice, () => q("delete from bills"));
      await as(alice, () => q("delete from installments"));
      bill = (await q1<{ id: string }>(alice, "insert into bills (name, amount, due_day, category_id) values ('Internet', 350000, 5, $1) returning id", [FOOD])).id;
      inst = (await q1<{ id: string }>(alice, "insert into installments (name, monthly_amount, tenor, start_month, due_day, paid_before, category_id) values ('HP', 500000, 3, '2026-09-01', 10, 1, $1) returning id", [FOOD])).id;
    });

    it("pay_bill with a transaction is atomic and changes the balance once", async () => {
      await q1(alice, "select pay_bill($1, 2026, 11, 360000, '2026-11-05', true)", [bill]);
      const p = await q1<{ amount: string; transaction_id: string | null }>(alice, "select amount, transaction_id from bill_payments where bill_id = $1", [bill]);
      expect(p.amount).toBe("360000");
      expect(p.transaction_id).toBeTruthy();
      expect(await balance(alice)).toBe(1_000_000 - 360_000);
      const tx = await q1<{ description: string; category_id: string; type: string }>(alice, "select description, category_id, type from transactions where id = $1", [p.transaction_id]);
      expect(tx).toEqual({ description: "Internet", category_id: FOOD, type: "expense" });
    });

    it("pay_bill without a transaction only records the payment", async () => {
      await q1(alice, "select pay_bill($1, 2026, 11, 350000, '2026-11-05', false)", [bill]);
      expect(await balance(alice)).toBe(1_000_000);
      expect(await as(alice, () => q("select 1 from bill_payments where bill_id = $1 and transaction_id is null", [bill]))).toHaveLength(1);
    });

    it("a bill can be paid once per month", async () => {
      await q1(alice, "select pay_bill($1, 2026, 11, 350000, '2026-11-05', false)", [bill]);
      const e = await pgError(as(alice, () => q("select pay_bill($1, 2026, 11, 350000, '2026-11-06', true)", [bill])));
      expect(e.code).toBe("23505");
      expect(await balance(alice)).toBe(1_000_000); // the failed call left no transaction behind
      await q1(alice, "select pay_bill($1, 2026, 12, 350000, '2026-12-05', false)", [bill]); // next month is fine
    });

    it("deleting the linked transaction un-pays the bill", async () => {
      await q1(alice, "select pay_bill($1, 2026, 11, 350000, '2026-11-05', true)", [bill]);
      await as(alice, () => q("delete from transactions where description = 'Internet'"));
      expect(await as(alice, () => q("select 1 from bill_payments where bill_id = $1", [bill]))).toHaveLength(0);
    });

    it("bills and installments only accept expense categories", async () => {
      expect((await pgError(as(alice, () => q("insert into bills (name, amount, due_day, category_id) values ('X', 1, 1, $1)", [SALARY])))).code).toBe("23503");
      expect((await pgError(as(alice, () => q("insert into installments (name, monthly_amount, tenor, start_month, due_day, category_id) values ('X', 1, 1, '2026-01-01', 1, $1)", [SALARY])))).code).toBe("23503");
    });

    it("validates amounts, due day, tenor and the first-of-month start", async () => {
      for (const sql of [
        "insert into bills (name, amount, due_day, category_id) values ('X', 0, 1, $1)",
        "insert into bills (name, amount, due_day, category_id) values ('X', 1, 32, $1)",
        "insert into installments (name, monthly_amount, tenor, start_month, due_day, category_id) values ('X', 1, 0, '2026-01-01', 1, $1)",
        "insert into installments (name, monthly_amount, tenor, start_month, due_day, category_id) values ('X', 1, 2, '2026-01-15', 1, $1)",
        "insert into installments (name, monthly_amount, tenor, start_month, due_day, paid_before, category_id) values ('X', 1, 2, '2026-01-01', 1, 3, $1)",
      ]) {
        expect((await pgError(as(alice, () => q(sql, [FOOD])))).code).toBe("23514");
      }
    });

    it("pay_installment records payments and refuses to go past the tenor", async () => {
      await q1(alice, "select pay_installment($1, 500000, '2026-10-10', true)", [inst]);
      const tx = await q1<{ notes: string }>(alice, "select notes from transactions where description = 'HP'");
      expect(tx.notes).toBe("Cicilan ke-2 dari 3");
      await q1(alice, "select pay_installment($1, 500000, '2026-11-10', false)", [inst]);
      const e = await pgError(as(alice, () => q("select pay_installment($1, 500000, '2026-12-10', true)", [inst])));
      expect(e.code).toBe("23514");
      expect(await balance(alice)).toBe(1_000_000 - 500_000);
    });

    it("users cannot see or pay each other's bills", async () => {
      expect(await as(bob, () => q("select * from bills"))).toHaveLength(0);
      const e = await pgError(as(bob, () => q("select pay_bill($1, 2026, 11, 1, '2026-11-05', true)", [bill])));
      expect(e.code).toBe("P0002");
    });

    it("category reassignment moves bills and installments; usage counts them", async () => {
      const [tmp] = await as(alice, () => q<{ id: string }>("insert into categories (name, type) values ('Langganan', 'expense') returning id"));
      await as(alice, () => q("update bills set category_id = $1 where id = $2", [tmp.id, bill]));
      await as(alice, () => q("update installments set category_id = $1 where id = $2", [tmp.id, inst]));
      const usage = await q1<{ transaction_count: string; bill_count: string; installment_count: string }>(alice, "select * from category_usage() where category_id = $1", [tmp.id]);
      expect(usage).toMatchObject({ transaction_count: "0", bill_count: "1", installment_count: "1" });
      expect((await pgError(as(alice, () => q("delete from categories where id = $1", [tmp.id])))).code).toBe("23503");
      await as(alice, () => q("select reassign_and_delete_category($1, $2)", [tmp.id, TRANSPORT]));
      expect((await q1<{ category_id: string }>(alice, "select category_id from bills where id = $1", [bill])).category_id).toBe(TRANSPORT);
      expect((await q1<{ category_id: string }>(alice, "select category_id from installments where id = $1", [inst])).category_id).toBe(TRANSPORT);
    });
  });

  describe("row level security", () => {
    it("users only see their own data", async () => {
      await addTx(alice, "income", 9_999, SALARY);
      expect(await as(bob, () => q("select * from transactions"))).toHaveLength(0);
      expect(await balance(bob)).toBe(0);
      const updated = await as(bob, () => q("update transactions set amount = 1 returning id"));
      expect(updated).toHaveLength(0);
    });
    it("anonymous requests cannot read anything", async () => {
      const e = await pgError(as(null, () => q("select * from transactions")));
      expect(e.code).toBe("42501");
    });
  });

  describe("filters & reports", () => {
    beforeEach(async () => {
      await addTx(alice, "income", 3_000_000, SALARY, "2026-10-01", "Gaji Oktober");
      await addTx(alice, "expense", 100_000, FOOD, "2026-10-31", "Makan malam Halloween");
      await addTx(alice, "expense", 40_000, FOOD, "2026-11-01", "Sarapan 50% off");
      await addTx(alice, "expense", 60_000, TRANSPORT, "2026-11-30", "Ojek");
      await addTx(alice, "income", 2_000_000, SALARY, "2026-11-30", "Gaji November");
    });

    const totals = async (ym: { year: number; month: number }) => {
      const { start, end } = monthRange(ym);
      const [r] = await as(alice, () => q<{ total_income: string; total_expense: string; transaction_count: string }>("select * from transaction_totals($1, $2)", [start, end]));
      return { income: Number(r.total_income), expense: Number(r.total_expense), count: Number(r.transaction_count) };
    };
    const search = (args: { q?: string; type?: string; category?: string; start?: string | null; end?: string | null; sort?: string; limit?: number; offset?: number }) =>
      as(alice, () =>
        q<{ description: string; total_count: string; transaction_date: Date }>(
          "select * from search_transactions($1, $2::transaction_type, $3::uuid, $4::date, $5::date, $6, $7, $8)",
          [args.q ?? null, args.type ?? null, args.category ?? null, args.start ?? null, args.end ?? null, args.sort ?? "newest", args.limit ?? 20, args.offset ?? 0],
        ),
      );

    it("scenario 7: October and November are separated at the boundary", async () => {
      expect(await totals({ year: 2026, month: 10 })).toEqual({ income: 3_000_000, expense: 100_000, count: 2 });
      expect(await totals({ year: 2026, month: 11 })).toEqual({ income: 2_000_000, expense: 100_000, count: 3 });
      expect(await totals({ year: 2026, month: 12 })).toEqual({ income: 0, expense: 0, count: 0 });
    });
    it("filter by month / date", async () => {
      const oct = await search(filtersToDateRange({ month: "2026-10" }));
      expect(oct.map((r) => r.description)).toEqual(["Makan malam Halloween", "Gaji Oktober"]);
      const day = await search(filtersToDateRange({ date: "2026-11-30" }));
      expect(day).toHaveLength(2);
    });
    it("filter by category and type", async () => {
      expect((await search({ category: FOOD })).map((r) => r.description).sort()).toEqual(["Makan malam Halloween", "Sarapan 50% off"]);
      expect(await search({ type: "income" })).toHaveLength(2);
      expect(await search({ type: "expense", category: TRANSPORT })).toHaveLength(1);
    });
    it("search by description is case-insensitive and treats % literally", async () => {
      expect(await search({ q: "gaji" })).toHaveLength(2);
      expect(await search({ q: "50%" })).toHaveLength(1);
      expect(await search({ q: "%" })).toHaveLength(1);
    });
    it("sorts newest / oldest and paginates with total count", async () => {
      const newest = await search({ sort: "newest" });
      expect(newest[0].description).toBe("Gaji November"); // same date, created later
      const oldest = await search({ sort: "oldest" });
      expect(oldest[0].description).toBe("Gaji Oktober");
      const page2 = await search({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(2);
      expect(Number(page2[0].total_count)).toBe(5);
    });
    it("monthly_totals groups by month", async () => {
      const rows = await as(alice, () => q("select * from monthly_totals('2026-01-01', '2027-01-01')"));
      expect(rows).toEqual([
        { year: 2026, month: 10, total_income: "3000000", total_expense: "100000" },
        { year: 2026, month: 11, total_income: "2000000", total_expense: "100000" },
      ]);
    });
    it("scenario 6: budget usage from database records", async () => {
      await as(alice, () => q("insert into budgets (category_id, month, year, amount) values ($1, 11, 2026, 1000000)", [FOOD]));
      await addTx(alice, "expense", 710_000, FOOD, "2026-11-15");
      await addTx(alice, "income", 5_000_000, SALARY, "2026-11-15"); // must not affect budget
      const { start, end } = monthRange({ year: 2026, month: 11 });
      const [row] = await as(alice, () =>
        q<{ limit: string; spent: string }>(
          `select b.amount as limit, coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as spent
             from budgets b left join transactions t
               on t.category_id = b.category_id and t.transaction_date >= $2 and t.transaction_date < $3
            where b.category_id = $1 and b.year = 2026 and b.month = 11 group by b.amount`,
          [FOOD, start, end],
        ),
      );
      const usage = computeBudgetUsage(Number(row.limit), Number(row.spent));
      expect(usage.spent).toBe(750_000);
      expect(usage.remaining).toBe(250_000);
      expect(usage.percentage).toBe(75);
    });
  });
});
