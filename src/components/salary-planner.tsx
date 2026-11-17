"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { saveSalaryPlan } from "@/app/actions/salary-plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/input";
import { formatIDR, parseIDRInput } from "@/lib/format";
import { BUCKET_LABELS, BUCKETS, donutShares, summarizePlan, type Bucket, type PlanItem } from "@/lib/salary-plan";
import { cn } from "@/lib/utils";
import { MAX_AMOUNT, MAX_PLAN_ITEMS } from "@/lib/validation";

/** Validated categorical colours (same family as the charts). */
const COLORS: Record<Bucket, string> = { needs: "#2a78d6", wants: "#eda100", savings: "#1baf7a" };
const LEFT_COLOR = "rgb(29 29 31 / 0.14)";

interface Row extends PlanItem {
  key: number;
}

const digitsOnly = (v: string) => {
  const n = parseIDRInput(v.slice(0, 20));
  return Number.isNaN(n) ? 0 : Math.min(n, MAX_AMOUNT);
};
const grouped = (n: number) => (n ? n.toLocaleString("id-ID") : "");

export function SalaryPlanner({ initial, savedAt }: { initial: { salary: number; items: PlanItem[] } | null; savedAt: string | null }) {
  const nextKey = React.useRef(0);
  const withKeys = (items: PlanItem[]) => items.map((it) => ({ ...it, key: nextKey.current++ }));

  const [salary, setSalary] = React.useState(initial?.salary ?? 0);
  const [rows, setRows] = React.useState<Row[]>(() => withKeys(initial?.items ?? []));
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const [bucket, setBucket] = React.useState<Bucket>("needs");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(() => JSON.stringify({ salary: initial?.salary ?? 0, items: initial?.items ?? [] }));
  const [pending, startTransition] = React.useTransition();

  const items: PlanItem[] = rows.map(({ name, amount, bucket }) => ({ name, amount, bucket }));
  const summary = summarizePlan(salary, items);
  const dirty = JSON.stringify({ salary, items }) !== saved;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setFormError("Tulis dulu untuk apa.");
    if (amount <= 0) return setFormError("Nominal harus lebih dari Rp0.");
    if (rows.length >= MAX_PLAN_ITEMS) return setFormError(`Maksimal ${MAX_PLAN_ITEMS} rencana.`);
    setRows((r) => [...r, { name: n.slice(0, 60), amount, bucket, key: nextKey.current++ }]);
    setName("");
    setAmount(0);
    setFormError(null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveSalaryPlan({ salary, items });
      if (res.ok) {
        setSaved(JSON.stringify({ salary, items }));
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
  const donut = salary > 0 || summary.spent > 0 ? `conic-gradient(${stops}, ${LEFT_COLOR} ${at}% 100%)` : LEFT_COLOR;

  const statusBox =
    summary.status === "over"
      ? { cls: "bg-expense-soft text-expense-strong", title: "Rencanamu lebih dari gaji", value: formatIDR(-summary.left) }
      : summary.status === "exact"
        ? { cls: "bg-income-soft text-income-strong", title: "Pas, semua gaji sudah punya tujuan", value: formatIDR(0) }
        : summary.status === "under"
          ? { cls: "bg-accent-soft text-accent-strong", title: "Sisa yang belum direncanakan", value: `${formatIDR(summary.left)} (${summary.leftPercent}%)` }
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

        <form onSubmit={add} noValidate>
          <p className="mb-2 text-sm font-extrabold text-ink">Mau dipakai untuk apa?</p>
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Untuk apa"
              placeholder="mis. Sewa kos"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 min-w-0 flex-[2_1_150px] rounded-2xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-black/15 outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-primary-strong"
            />
            <span className="flex h-11 min-w-0 flex-[1_1_120px] items-center gap-1.5 rounded-2xl bg-white px-3 ring-1 ring-black/15 focus-within:ring-2 focus-within:ring-primary-strong">
              <span className="text-sm font-bold text-ink-soft">Rp</span>
              <input
                aria-label="Nominal"
                inputMode="numeric"
                placeholder="0"
                value={grouped(amount)}
                onChange={(e) => setAmount(digitsOnly(e.target.value))}
                className="tabular min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none placeholder:text-ink-faint"
              />
            </span>
            <select
              aria-label="Kelompok"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as Bucket)}
              className="select-chevron h-11 min-w-0 flex-[1_1_130px] cursor-pointer appearance-none rounded-2xl bg-white pr-9 pl-3 text-sm font-semibold text-ink ring-1 ring-black/15 outline-none focus:ring-2 focus:ring-primary-strong"
            >
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {BUCKET_LABELS[b]}
                </option>
              ))}
            </select>
            <Button type="submit" size="icon" className="size-11" aria-label="Tambah rencana">
              <Plus />
            </Button>
          </div>
          <FieldError messages={formError ? [formError] : undefined} />
        </form>

        <div className="space-y-5">
          {BUCKETS.map((b) => {
            const list = rows.filter((r) => r.bucket === b);
            return (
              <section key={b} aria-label={BUCKET_LABELS[b]}>
                <div className="flex items-center gap-2 px-1">
                  <span aria-hidden className="size-3 rounded-full" style={{ background: COLORS[b] }} />
                  <h2 className="flex-1 text-[15px] font-black text-ink">{BUCKET_LABELS[b]}</h2>
                  <span className="tabular rounded-full border border-white/25 bg-[#1d1d1f]/65 px-3 py-1 text-sm font-black text-white backdrop-blur-md">
                    {formatIDR(summary.totals[b])}
                  </span>
                </div>
                {list.length ? (
                  <ul className="mt-1.5 space-y-1.5">
                    {list.map((r) => (
                      <li
                        key={r.key}
                        className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/50 py-1 pr-1 pl-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-md"
                      >
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{r.name}</span>
                        <span className="tabular text-[15px] font-bold text-ink">{formatIDR(r.amount)}</span>
                        <button
                          type="button"
                          onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))}
                          aria-label={`Hapus ${r.name}`}
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-white/70"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 rounded-2xl border border-dashed border-black/30 px-3.5 py-2.5 text-sm font-semibold text-ink">Belum ada rencana di sini</p>
                )}
              </section>
            );
          })}
          <div className="flex items-center gap-2 rounded-2xl border border-white/25 bg-[#1d1d1f]/65 px-4 py-3.5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] backdrop-blur-lg">
            <span className="flex-1 text-[15px] font-bold">Total pengeluaran</span>
            <span className="tabular text-xl font-black">{formatIDR(summary.spent)}</span>
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
        <ul className="space-y-2">
          {BUCKETS.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: COLORS[b] }} />
              <span className="flex-1">{BUCKET_LABELS[b]}</span>
              <span className="tabular font-black">{summary.percents[b]}%</span>
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
          <ExportMenu salary={salary} items={items} disabled={salary <= 0} />
        </div>
        {salary <= 0 ? <p className="text-xs font-semibold text-ink-soft">Isi gaji dulu sebelum menyimpan.</p> : dirty ? <p className="text-xs font-semibold text-ink-soft">Ada perubahan yang belum disimpan.</p> : null}
      </Card>
    </div>
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

async function exportExcel(salary: number, items: PlanItem[]) {
  const s = summarizePlan(salary, items);
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lumi";
  const money = '"Rp"#,##0;-"Rp"#,##0';
  const sum = wb.addWorksheet("Ringkasan");
  sum.columns = [{ header: "Keterangan", key: "label", width: 30 }, { header: "Nominal", key: "amount", width: 20, style: { numFmt: money } }, { header: "% gaji", key: "pct", width: 10 }];
  sum.getRow(1).font = { bold: true };
  sum.addRow({ label: "Gaji", amount: salary, pct: "100%" });
  BUCKETS.forEach((b) => sum.addRow({ label: BUCKET_LABELS[b], amount: s.totals[b], pct: `${s.percents[b]}%` }));
  sum.addRow({ label: "Total pengeluaran", amount: s.spent });
  sum.addRow({ label: s.left < 0 ? "Kurang dari gaji" : "Sisa", amount: Math.abs(s.left), pct: s.left > 0 ? `${s.leftPercent}%` : "" });
  sum.addRow({ label: "Pola (butuh / ingin / tabung)", amount: null, pct: s.pattern });
  const det = wb.addWorksheet("Rincian");
  det.columns = [{ header: "Kelompok", key: "bucket", width: 14 }, { header: "Untuk apa", key: "name", width: 34 }, { header: "Nominal", key: "amount", width: 20, style: { numFmt: money } }];
  det.getRow(1).font = { bold: true };
  BUCKETS.forEach((b) => items.filter((i) => i.bucket === b).forEach((i) => det.addRow({ bucket: BUCKET_LABELS[b], name: i.name, amount: i.amount })));
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "rencana-gaji.xlsx");
}

async function exportPdf(salary: number, items: PlanItem[]) {
  const s = summarizePlan(salary, items);
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
    head: [["Ringkasan", "Nominal", "% gaji"]],
    body: [
      ...BUCKETS.map((b) => [BUCKET_LABELS[b], formatIDR(s.totals[b]), `${s.percents[b]}%`]),
      ["Total pengeluaran", formatIDR(s.spent), ""],
      [s.left < 0 ? "Kurang dari gaji" : "Sisa", formatIDR(Math.abs(s.left)), s.left > 0 ? `${s.leftPercent}%` : ""],
    ],
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  autoTable(doc, {
    ...common,
    startY: y,
    head: [["Kelompok", "Untuk apa", "Nominal"]],
    body: items.length ? BUCKETS.flatMap((b) => items.filter((i) => i.bucket === b).map((i) => [BUCKET_LABELS[b], i.name, formatIDR(i.amount)])) : [["—", "Belum ada rencana", ""]],
    columnStyles: { 2: { halign: "right" } },
  });
  doc.save("rencana-gaji.pdf");
}

function ExportMenu({ salary, items, disabled }: { salary: number; items: PlanItem[]; disabled: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const run = async (kind: "xlsx" | "pdf") => {
    setOpen(false);
    setBusy(true);
    try {
      await (kind === "xlsx" ? exportExcel(salary, items) : exportPdf(salary, items));
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
