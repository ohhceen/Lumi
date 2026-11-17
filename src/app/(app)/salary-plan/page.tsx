import { PageHeader } from "@/components/page-header";
import { SalaryPlanner } from "@/components/salary-planner";
import { getSalaryPlan } from "@/lib/data";

export const metadata = { title: "Rencana Gaji" };

export default async function SalaryPlanPage() {
  const plan = await getSalaryPlan();
  return (
    <div>
      <PageHeader title="Rencana Gaji" description="Bagi gajimu ke tiga pos sebelum gajinya diterima. Hanya simulasi, saldo dan transaksimu tidak berubah." />
      <SalaryPlanner initial={plan ? { salary: plan.salary, allocations: plan.allocations, items: plan.items } : null} savedAt={plan?.updated_at ?? null} />
    </div>
  );
}
