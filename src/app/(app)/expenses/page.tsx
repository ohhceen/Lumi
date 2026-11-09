import { TransactionsView } from "@/components/transactions-view";

export const metadata = { title: "Pengeluaran" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <TransactionsView searchParams={await searchParams} fixedType="expense" />;
}
