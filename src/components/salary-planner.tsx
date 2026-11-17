"use client";

import * as React from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { saveSalaryPlan } from "@/app/actions/salary-plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/input";
import { formatIDR, parseIDRInput } from "@/lib/format";
import {
  amountForPercent,
  BUCKET_HINTS,
  BUCKET_LABELS,
  BUCKETS,
  donutShares,
  summarizePlan,
  type Allocations,
  type Bucket,
  type PlanItem,
} from "@/lib/salary-plan";
import { cn } from "@/lib/utils";
import { MAX_AMOUNT, MAX_PLAN_ITEMS } from "@/lib/validation";

/** Validated categorical colours (same family as the charts). */
const COLORS: Record<Bucket, string> = { needs: "#2a78d6", wants: "#eda100", savings: "#1baf7a" };
const LEFT_COLOR = "rgb(29 29 31 / 0.14)";
const EMPTY: Allocations = { needs: 0, wants: 0, savings: 0 };

interface Row extends PlanItem {
  key: number;
}

const digitsOnly = (v: string) => {
  const n = parseIDRInput(v.slice(0, 20));
  return Number.isNaN(n) ? 0 : Math.min(n, MAX_AMOUNT);
};
const grouped = (n: number) => (n ? n.toLocaleString("id-ID") : "");

const glassRow = "rounded-3xl border border-white/80 bg-white/50 shadow-[inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-md";
const darkGlass = "border border-white/25 bg-[#1d1d1f]/65 text-white backdrop-blur-md";
const field = "rounded-2xl bg-white ring-1 ring-black/15 outline-none focus-within:ring-2 focus-within:ring-primary-strong focus:ring-2 focus:ring-primary-strong";

type Initial = { salary: number; allocations: Allocations; items: PlanItem[] } | null;

export function SalaryPlanner({ initial, savedAt }: { initial: Initial; savedAt: string | null }) {
  const nextKey = React.useRef(0);
  const [salary, setSalary] = React.useState(initial?.salary ?? 0);
  const [alloc, setAlloc] = React.useState<Allocations>(initial?.allocations ?? EMPTY);
  const [rows, setRows] = React.useState<Row[]>(() => (initial?.items ?? []).map((it) => ({ ...it, key: nextKey.current++ })));
  const [open, setOpen] = React.useState<Record<Bucket, boolean>>(() => {
    const has = (b: Bucket) => (initial?.items ?? []).some((i) => i.bucket === b);
    return { needs: has("needs"), wants: has("wants"), savings: has("savings") };
  });
  const snapshot = (sal: number, a: Allocations, items: PlanItem[]) => JSON.stringify({ sal, a, items });
  const [saved, setSaved] = React.useState(() => snapshot(initial?.salary ?? 0, initial?.allocations ?? EMPTY, initial?.items ?? []));
  const [pending, startTransition] = React.useTransition();

  const items: PlanItem[] = rows.map(({ name, amount, bucket }) => ({ name, amount, bucket }));
  const summary = summarizePlan(salary, alloc, items);
  const dirty = snapshot(salary, alloc, items) !== saved;

  const setPos = (b: Bucket, v: number) => setAlloc((a) => ({ ...a, [b]: v }));

  const save = () =>
    startTransition(async () => {
      const res = await saveSalaryPlan({ salary, allocations: alloc, items });
      if (res.ok) {
        setSaved(snapshot(salary, alloc, items));
        toast.success(res.message);
      } else toast.error(res.message);
    });

  const shares = donutShares(salary, summary);
  let at = 0;
  const stops = [...BUCKETS.map((b) => [COLORS[b], shares[b]] as const), [LEFT_COLOR, shares.left] as const]
    .map(([c, f]) => {
      const from = at;
      at += f * 100;
      return `${c} ${from}% ${at}%`;
    })
    .join(", ");
  const donut = salary > 0 || summary.allocated > 0 ? `conic-gradient(${stops}, ${LEFT_COLOR} ${at}% 100%)` : LEFT_COLOR;

  const statusBox =
    summary.status === "over"
      ? { cls: "bg-expense-soft text-expense-strong", title: "Pembagianmu lebih dari gaji", value: formatIDR(-summary.left) }
      : summary.status === "exact"
        ? { cls: "bg-income-soft text-income-strong", title: "Pas, semua gaji sudah dibagi", value: formatIDR(0) }
        : summary.status === "under"
          ? { cls: "bg-accent-soft text-accent-strong", title: "Belum dibagi ke pos mana pun", value: `${formatIDR(summary.left)} (${summary.leftPercent}%)` }
          : { cls: "bg-white/60 text-ink", title: "Ketik gajimu dulu untuk melihat polanya", value: "—" };

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <Card className="min-w-0 flex-[1.5] space-y-6">
        <div>
          <label htmlFor="plan-salary" className="mb-2 block text-sm font-extrabold text-ink">
            Gaji yang akan diterima
          </label>
          <div className="flex h-14 items-center gap-2 rounded-2xl bg-white px-4 ring-2 ring-primary-strong">
            <span className="text-lg font-bold text-ink-soft">Rp</span>
            <input
              id="plan-salary"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={grouped(salary)}
              onChange={(e) => setSalary(digitsOnly(e.target.value))}
              className="tabular min-w-0 flex-1 bg-transparent text-2xl font-black text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-[15px] font-black text-ink">Bagi ke 3 pos</h2>
            <p className="text-xs font-semibold text-ink-soft">Isi dalam Rupiah atau persen, keduanya saling menyesuaikan.</p>
          </div>
          {BUCKETS.map((b) => (
            <PosCard
              key={b}
              bucket={b}
              salary={salary}
              amount={alloc[b]}
              percent={summary.percents[b]}
              onAmount={(v) => setPos(b, v)}
              rows={rows.filter((r) => r.bucket === b)}
              detail={summary.details[b]}
              open={open[b]}
              onToggle={() => setOpen((o) => ({ ...o, [b]: !o[b] }))}
              onAdd={(name, amount) => setRows((r) => [...r, { name, amount, bucket: b, key: nextKey.current++ }])}
              onRemove={(key) => setRows((r) => r.filter((x) => x.key !== key))}
              full={rows.length >= MAX_PLAN_ITEMS}
            />
          ))}
          <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-2xl px-4 py-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]", darkGlass)}>
            <span className="flex-1 text-[15px] font-bold">Total dibagi</span>
            <span className="tabular text-xl font-black">{formatIDR(summary.allocated)}</span>
            {salary > 0 ? <span className="w-full text-right text-xs font-semibold text-white/85">dari gaji {formatIDR(salary)}</span> : null}
          </div>
        </div>
      </Card>

      <Card className="min-w-0 flex-1 space-y-5 lg:sticky lg:top-4">
        <h2 className="text-[15px] font-black text-ink">Pola gajimu</h2>
        <div
          role="img"
          aria-label={`Kebutuhan ${summary.percents.needs}%, keinginan ${summary.percents.wants}%, tabungan ${summary.percents.savings}%`}
          className="mx-auto flex size-48 items-center justify-center rounded-full"
          style={{ background: donut }}
        >
          <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white text-center">
            <span className="tabular text-2xl font-black tracking-tight text-ink">{summary.pattern}</span>
          </div>
        </div>
        <p className="-mt-2 text-center text-xs font-semibold text-ink-soft">Kebutuhan / Keinginan / Tabungan (% dari gaji)</p>
        <ul className="space-y-2.5">
          {BUCKETS.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: COLORS[b] }} />
              <span className="flex-1">{BUCKET_LABELS[b]}</span>
              <span className="tabular font-black">{formatIDR(alloc[b])}</span>
              <span className="tabular w-11 text-right font-black">{summary.percents[b]}%</span>
            </li>
          ))}
        </ul>
        <div role="status" className={cn("rounded-2xl px-4 py-3.5", statusBox.cls)}>
          <p className="text-sm font-bold">{statusBox.title}</p>
          <p className="tabular mt-0.5 text-2xl font-black">{statusBox.value}</p>
          {salary > 0 ? <p className="mt-0.5 text-xs font-bold">dari gaji {formatIDR(salary)}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={pending || salary <= 0 || !dirty} className="flex-1">
            {pending ? <Loader2 className="animate-spin" /> : null}
            {dirty || !savedAt ? "Simpan rencana" : "Tersimpan"}
          </Button>
          <ExportMenu salary={salary} allocations={alloc} items={items} disabled={salary <= 0} />
        </div>
        {salary <= 0 ? <p className="text-xs font-semibold text-ink-soft">Isi gaji dulu sebelum menyimpan.</p> : dirty ? <p className="text-xs font-semibold text-ink-soft">Ada perubahan yang belum disimpan.</p> : null}
      </Card>
    </div>
  );
}

function PosCard({
  bucket,
  salary,
  amount,
  percent,
  onAmount,
  rows,
  detail,
  open,
  onToggle,
  onAdd,
  onRemove,
  full,
}: {
  bucket: Bucket;
  salary: number;
  amount: number;
  percent: number;
  onAmount: (v: number) => void;
  rows: Row[];
  detail: { itemsTotal: number; itemsLeft: number; itemsCount: number };
  open: boolean;
  onToggle: () => void;
  onAdd: (name: string, amount: number) => void;
  onRemove: (key: number) => void;
  full: boolean;
}) {
  const label = BUCKET_LABELS[bucket];
  const [pctText, setPctText] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [itemAmount, setItemAmount] = React.useState(0);
  const [err, setErr] = React.useState<string | null>(null);
  const panelId = `rincian-${bucket}`;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setErr("Tulis dulu untuk apa.");
    if (itemAmount <= 0) return setErr("Nominal harus lebih dari Rp0.");
    if (full) return setErr(`Maksimal ${MAX_PLAN_ITEMS} rincian.`);
    onAdd(n.slice(0, 60), itemAmount);
    setName("");
    setItemAmount(0);
    setErr(null);
  };

  return (
    <section aria-label={`Pos ${label}`} className={cn(glassRow, "p-4")}>
      <div className="flex items-start gap-2.5">
        <span aria-hidden className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: COLORS[bucket] }} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-black text-ink">{label}</h3>
          <p className="text-xs font-semibold text-ink-soft">{BUCKET_HINTS[bucket]}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <span className={cn(field, "flex h-12 min-w-0 flex-1 items-center gap-1.5 px-3.5")}>
          <span className="text-sm font-bold text-ink-soft">Rp</span>
          <input
            aria-label={`Jatah ${label} dalam Rupiah`}
            inputMode="numeric"
            placeholder="0"
            value={grouped(amount)}
            onChange={(e) => onAmount(digitsOnly(e.target.value))}
            className="tabular min-w-0 flex-1 bg-transparent text-lg font-black text-ink outline-none placeholder:text-ink-faint"
          />
        </span>
        <span className={cn(field, "flex h-12 w-24 shrink-0 items-center gap-1 px-3", salary <= 0 && "opacity-60")}>
          <input
            aria-label={`Jatah ${label} dalam persen`}
            inputMode="numeric"
            disabled={salary <= 0}
            value={pctText ?? (salary > 0 ? String(percent) : "")}
            placeholder="0"
            onFocus={() => setPctText(salary > 0 ? String(percent) : "")}
            onBlur={() => setPctText(null)}
            onChange={(e) => {
              const t = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
              setPctText(t);
              onAmount(amountForPercent(salary, Math.min(100, Number(t || 0))));
            }}
            className="tabular min-w-0 flex-1 bg-transparent text-right text-lg font-black text-ink outline-none disabled:cursor-not-allowed"
          />
          <span className="text-sm font-bold text-ink-soft">%</span>
        </span>
      </div>

      <div aria-hidden className="mt-2.5 h-2 overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, percent)}%`, background: COLORS[bucket] }} />
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-1 text-sm font-bold text-ink hover:underline"
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        Rincian (opsional){detail.itemsCount ? ` · ${detail.itemsCount}` : ""}
      </button>

      {open ? (
        <div id={panelId} className="mt-2 space-y-2">
          {rows.length ? (
            <ul className="space-y-1.5">
              {rows.map((r) => (
                <li key={r.key} className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/55 py-1 pr-1 pl-3.5">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{r.name}</span>
                  <span className="tabular text-[15px] font-bold text-ink">{formatIDR(r.amount)}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(r.key)}
                    aria-label={`Hapus ${r.name}`}
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-white/70"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <form onSubmit={add} noValidate className="flex gap-2">
            <input
              aria-label={`Rincian ${label}: untuk apa`}
              placeholder="mis. Sewa kos"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(field, "h-11 min-w-0 flex-[1.4_1_0%] px-3.5 text-sm font-semibold text-ink placeholder:text-ink-faint")}
            />
            <span className={cn(field, "flex h-11 min-w-0 flex-[1_1_0%] items-center gap-1 px-3")}>
              <span className="text-sm font-bold text-ink-soft">Rp</span>
              <input
                aria-label={`Rincian ${label}: nominal`}
                inputMode="numeric"
                placeholder="0"
                value={grouped(itemAmount)}
                onChange={(e) => setItemAmount(digitsOnly(e.target.value))}
                className="tabular min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none placeholder:text-ink-faint"
              />
            </span>
            <Button type="submit" size="icon" className="size-11 shrink-0" aria-label={`Tambah rincian ${label}`}>
              <Plus />
            </Button>
          </form>
          <FieldError messages={err ? [err] : undefined} />
          {detail.itemsCount ? (
            <p className={cn("rounded-2xl px-3.5 py-2 text-sm font-bold", detail.itemsLeft < 0 ? "bg-expense-soft text-expense-strong" : "bg-white/60 text-ink")}>
              {detail.itemsLeft < 0
                ? `Rincian lebih ${formatIDR(-detail.itemsLeft)} dari jatah ${label}.`
                : `Terpakai ${formatIDR(detail.itemsTotal)} dari ${formatIDR(amount)} · sisa ${formatIDR(detail.itemsLeft)}`}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------- export

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function detailRows(allocations: Allocations, items: PlanItem[]) {
  return BUCKETS.flatMap((b) => items.filter((i) => i.bucket === b).map((i) => ({ bucket: BUCKET_LABELS[b], name: i.name, amount: i.amount, alloc: allocations[b] })));
}

async function exportExcel(salary: number, allocations: Allocations, items: PlanItem[]) {
  const s = summarizePlan(salary, allocations, items);
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lumi";
  const money = '"Rp"#,##0;-"Rp"#,##0';
  const sum = wb.addWorksheet("Pembagian");
  sum.columns = [{ header: "Pos", key: "label", width: 30 }, { header: "Jatah", key: "amount", width: 20, style: { numFmt: money } }, { header: "% gaji", key: "pct", width: 10 }, { header: "Rincian terisi", key: "items", width: 20, style: { numFmt: money } }];
  sum.getRow(1).font = { bold: true };
  sum.addRow({ label: "Gaji", amount: salary, pct: "100%" });
  BUCKETS.forEach((b) => sum.addRow({ label: BUCKET_LABELS[b], amount: allocations[b], pct: `${s.percents[b]}%`, items: s.details[b].itemsTotal || null }));
  sum.addRow({ label: "Total dibagi", amount: s.allocated });
  sum.addRow({ label: s.left < 0 ? "Lebih dari gaji" : "Belum dibagi", amount: Math.abs(s.left), pct: s.left > 0 ? `${s.leftPercent}%` : "" });
  sum.addRow({ label: "Pola (butuh / ingin / tabung)", amount: null, pct: s.pattern });
  if (items.length) {
    const det = wb.addWorksheet("Rincian");
    det.columns = [{ header: "Pos", key: "bucket", width: 14 }, { header: "Untuk apa", key: "name", width: 34 }, { header: "Nominal", key: "amount", width: 20, style: { numFmt: money } }];
    det.getRow(1).font = { bold: true };
    detailRows(allocations, items).forEach((r) => det.addRow(r));
  }
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "rencana-gaji.xlsx");
}

async function exportPdf(salary: number, allocations: Allocations, items: PlanItem[]) {
  const s = summarizePlan(salary, allocations, items);
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ink: [number, number, number] = [29, 29, 31];
  const head = { fillColor: [241, 241, 243] as [number, number, number], textColor: ink, fontStyle: "bold" as const };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.text("Lumi — Rencana Gaji", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Gaji ${formatIDR(salary)} · pola ${s.pattern} (butuh / ingin / tabung)`, 40, 70);
  const common = { headStyles: head, styles: { fontSize: 10, textColor: ink }, margin: { left: 40, right: 40 } };
  autoTable(doc, {
    ...common,
    startY: 90,
    head: [["Pos", "Jatah", "% gaji"]],
    body: [
      ...BUCKETS.map((b) => [BUCKET_LABELS[b], formatIDR(allocations[b]), `${s.percents[b]}%`]),
      ["Total dibagi", formatIDR(s.allocated), ""],
      [s.left < 0 ? "Lebih dari gaji" : "Belum dibagi", formatIDR(Math.abs(s.left)), s.left > 0 ? `${s.leftPercent}%` : ""],
    ],
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  if (items.length) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    autoTable(doc, {
      ...common,
      startY: y,
      head: [["Pos", "Rincian (opsional)", "Nominal"]],
      body: detailRows(allocations, items).map((r) => [r.bucket, r.name, formatIDR(r.amount)]),
      columnStyles: { 2: { halign: "right" } },
    });
  }
  doc.save("rencana-gaji.pdf");
}

function ExportMenu({ salary, allocations, items, disabled }: { salary: number; allocations: Allocations; items: PlanItem[]; disabled: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const run = async (kind: "xlsx" | "pdf") => {
    setOpen(false);
    setBusy(true);
    try {
      await (kind === "xlsx" ? exportExcel(salary, allocations, items) : exportPdf(salary, allocations, items));
      toast.success(kind === "xlsx" ? "Rencana gaji diunduh (Excel)." : "Rencana gaji diunduh (PDF).");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen((o) => !o)} disabled={disabled || busy} aria-expanded={open} aria-haspopup="menu">
        {busy ? <Loader2 className="animate-spin" /> : <Download />} Unduh
      </Button>
      {open ? (
        <div role="menu" className="absolute right-0 bottom-full z-10 mb-2 w-40 overflow-hidden rounded-2xl bg-white p-1 shadow-pop ring-1 ring-black/10">
          <button role="menuitem" type="button" onClick={() => run("xlsx")} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink hover:bg-primary-soft">
            <FileSpreadsheet className="size-4" /> Excel
          </button>
          <button role="menuitem" type="button" onClick={() => run("pdf")} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink hover:bg-primary-soft">
            <FileText className="size-4" /> PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
