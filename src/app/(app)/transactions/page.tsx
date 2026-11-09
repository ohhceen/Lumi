import { TransactionsView } from "@/components/transactions-view";

export const metadata = { title: "Transaksi" };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <TransactionsView searchParams={await searchParams} />;
}
