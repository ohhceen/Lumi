import { PageHeader } from "@/components/page-header";
import { SalaryPlanner } from "@/components/salary-planner";
import { getSalaryPlan } from "@/lib/data";

export const metadata = { title: "Rencana Gaji" };

export default async function SalaryPlanPage() {
  const plan = await getSalaryPlan();
  return (
    <div>
      <PageHeader title="Rencana Gaji" description="Bayangkan dulu gajimu mau dipakai untuk apa. Hanya simulasi, saldo dan transaksimu tidak berubah." />
      <SalaryPlanner initial={plan ? { salary: plan.salary, items: plan.items } : null} savedAt={plan?.updated_at ?? null} />
    </div>
  );
}
