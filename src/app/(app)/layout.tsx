import { Plus } from "lucide-react";
import { BottomNav, MobileTopBar, Sidebar } from "@/components/layout/app-nav";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { Button } from "@/components/ui/button";
import { getAppContext, getCategories } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [ctx, categories] = await Promise.all([getAppContext(), getCategories()]);

  return (
    <div className="bg-space flex min-h-dvh">
      <Sidebar name={ctx.profile.name}>
        <TransactionDialog
          categories={categories}
          defaultDate={ctx.today}
          trigger={
            <Button className="w-full" size="lg">
              <Plus /> Catat transaksi
            </Button>
          }
        />
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar>
          <TransactionDialog
            categories={categories}
            defaultDate={ctx.today}
            trigger={
              <Button size="sm" aria-label="Catat transaksi">
                <Plus /> Catat
              </Button>
            }
          />
        </MobileTopBar>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
