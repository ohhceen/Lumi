import { LogOut } from "lucide-react";
import { SettingsForm } from "@/components/forms/settings-form";
import { Mascot } from "@/components/mascot";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "@/app/actions/auth";
import { getAppContext, getTotals } from "@/lib/data";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const [ctx, totals] = await Promise.all([getAppContext(), getTotals()]);
  return (
    <div>
      <PageHeader title="Pengaturan" description="Atur saldo awal, zona waktu, dan profilmu." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Profil & Saldo</CardTitle>
              <CardDescription>Saldo = Saldo awal + Total pemasukan − Total pengeluaran</CardDescription>
            </div>
          </CardHeader>
          <SettingsForm name={ctx.profile.name} initialBalance={ctx.settings.initial_balance} timezone={ctx.timezone} totals={totals} />
        </Card>
        <div className="space-y-5">
          <Card className="flex flex-col items-center text-center">
            <Mascot mood="wink" className="size-24 animate-float" />
            <p className="mt-3 font-black">Akun</p>
            <p className="text-sm font-semibold break-all text-ink-soft">{ctx.user.email}</p>
            <p className="mt-2 text-xs font-bold text-ink-faint">Mata uang: Rupiah (IDR)</p>
            <form action={logout} className="mt-4">
              <Button variant="outline" type="submit">
                <LogOut /> Keluar
              </Button>
            </form>
          </Card>
          <Card>
            <CardTitle className="text-base">Tentang data kamu</CardTitle>
            <p className="mt-2 text-sm font-semibold text-ink-soft">
              Semua data tersimpan di database Supabase milikmu dan dilindungi Row Level Security — hanya akunmu yang bisa membacanya.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
