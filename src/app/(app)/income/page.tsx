import { TransactionsView } from "@/components/transactions-view";

export const metadata = { title: "Pemasukan" };

export default async function IncomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <TransactionsView searchParams={await searchParams} fixedType="income" />;
}
