"use client";

import * as React from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";

export interface ExportData {
  periodLabel: string;
  fileStem: string; // e.g. laporan-2026-11
  generatedAt: string;
  summary: { label: string; value: string }[];
  categories: { name: string; amount: number; count: number; percentage: number }[];
  daily: { date: string; income: number; expense: number; net: number }[];
  transactions: { date: string; description: string; category: string; type: string; amount: number; notes: string }[];
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportExcel(d: ExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "MyMoney Buddy";
  const money = '"Rp"#,##0;-"Rp"#,##0';
  const header = (ws: import("exceljs").Worksheet) => {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: "FF28364A" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F1FD" } };
  };

  const s = wb.addWorksheet("Ringkasan");
  s.columns = [{ header: "Keterangan", key: "label", width: 36 }, { header: "Nilai", key: "value", width: 30 }];
  header(s);
  s.addRow({ label: "Periode", value: d.periodLabel });
  d.summary.forEach((r) => s.addRow(r));
  s.addRow({ label: "Dibuat", value: d.generatedAt });

  const c = wb.addWorksheet("Kategori");
  c.columns = [
    { header: "Kategori", key: "name", width: 28 },
    { header: "Jumlah transaksi", key: "count", width: 18 },
    { header: "Total pengeluaran", key: "amount", width: 20, style: { numFmt: money } },
    { header: "Persentase", key: "pct", width: 12, style: { numFmt: "0.0%" } },
  ];
  header(c);
  d.categories.forEach((r) => c.addRow({ ...r, pct: r.percentage / 100 }));

  const dl = wb.addWorksheet("Harian");
  dl.columns = [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Pemasukan", key: "income", width: 18, style: { numFmt: money } },
    { header: "Pengeluaran", key: "expense", width: 18, style: { numFmt: money } },
    { header: "Arus kas bersih", key: "net", width: 18, style: { numFmt: money } },
  ];
  header(dl);
  d.daily.forEach((r) => dl.addRow(r));

  const t = wb.addWorksheet("Transaksi");
  t.columns = [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Deskripsi", key: "description", width: 34 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Jenis", key: "type", width: 14 },
    { header: "Jumlah", key: "amount", width: 18, style: { numFmt: money } },
    { header: "Catatan", key: "notes", width: 30 },
  ];
  header(t);
  d.transactions.forEach((r) => t.addRow(r));

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${d.fileStem}.xlsx`);
}

async function exportPdf(d: ExportData) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ink: [number, number, number] = [40, 54, 74];
  const head: [number, number, number] = [227, 241, 253];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.text("MyMoney Buddy — Laporan Keuangan", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Periode: ${d.periodLabel}`, 40, 70);
  doc.text(`Dibuat: ${d.generatedAt}`, 40, 86);

  const common = { headStyles: { fillColor: head, textColor: ink, fontStyle: "bold" as const }, styles: { fontSize: 9, textColor: ink }, margin: { left: 40, right: 40 } };
  autoTable(doc, { ...common, startY: 104, head: [["Ringkasan", "Nilai"]], body: d.summary.map((r) => [r.label, r.value]) });
  const y = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  if (d.categories.length) {
    autoTable(doc, {
      ...common,
      startY: y(),
      head: [["Kategori pengeluaran", "Transaksi", "Total", "%"]],
      body: d.categories.map((r) => [r.name, String(r.count), formatIDR(r.amount), `${r.percentage.toFixed(1)}%`]),
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
  }
  autoTable(doc, {
    ...common,
    startY: y(),
    head: [["Tanggal", "Deskripsi", "Kategori", "Jenis", "Jumlah"]],
    body: d.transactions.length ? d.transactions.map((r) => [r.date, r.description, r.category, r.type, formatIDR(r.amount)]) : [["—", "Tidak ada transaksi pada periode ini", "", "", ""]],
    columnStyles: { 4: { halign: "right" } },
  });
  doc.save(`${d.fileStem}.pdf`);
}

export function ReportExport({ data }: { data: ExportData }) {
  const [busy, setBusy] = React.useState<null | "xlsx" | "pdf">(null);
  const run = async (kind: "xlsx" | "pdf") => {
    setBusy(kind);
    try {
      await (kind === "xlsx" ? exportExcel(data) : exportPdf(data));
      toast.success(kind === "xlsx" ? "Laporan Excel diunduh 📊" : "Laporan PDF diunduh 📄");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat file laporan.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => run("xlsx")} disabled={!!busy}>
        {busy === "xlsx" ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Excel
      </Button>
      <Button variant="outline" onClick={() => run("pdf")} disabled={!!busy}>
        {busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />} PDF
      </Button>
    </div>
  );
}
