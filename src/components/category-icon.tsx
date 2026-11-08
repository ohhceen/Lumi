import {
  Baby, Banknote, Book, Briefcase, Bus, Car, Circle, CirclePlus, Coffee, Dog, Droplets, Dumbbell, Film, Fuel, Gamepad2,
  Gift, GraduationCap, HeartPulse, House, Landmark, Laptop, Music, PiggyBank, Pill, Plane, Receipt, Shirt, ShoppingBag,
  Smartphone, Sparkles, Star, Store, Tag, TrendingUp, Utensils, Wallet, Wifi, Zap, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/types";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase, laptop: Laptop, wallet: Wallet, store: Store, "trending-up": TrendingUp, "plus-circle": CirclePlus,
  banknote: Banknote, landmark: Landmark, "piggy-bank": PiggyBank, gift: Gift,
  utensils: Utensils, coffee: Coffee, bus: Bus, car: Car, fuel: Fuel, "shopping-bag": ShoppingBag, shirt: Shirt,
  gamepad: Gamepad2, film: Film, music: Music, "graduation-cap": GraduationCap, book: Book, "heart-pulse": HeartPulse,
  pill: Pill, dumbbell: Dumbbell, receipt: Receipt, zap: Zap, droplets: Droplets, wifi: Wifi, smartphone: Smartphone,
  home: House, plane: Plane, sparkles: Sparkles, baby: Baby, dog: Dog, star: Star, tag: Tag, circle: Circle,
};

export const ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryIcon({
  icon,
  type,
  className,
  size = "md",
}: {
  icon: string;
  type?: TransactionType;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = CATEGORY_ICONS[icon] ?? Circle;
  const box = { sm: "size-8 rounded-xl [&_svg]:size-4", md: "size-10 rounded-2xl [&_svg]:size-5", lg: "size-12 rounded-2xl [&_svg]:size-6" }[size];
  const tone =
    type === "income"
      ? "bg-income-soft text-income-strong"
      : type === "expense"
        ? "bg-expense-soft text-expense-strong"
        : "bg-primary-soft text-primary-strong";
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center", box, tone, className)}>
      <Icon strokeWidth={2.4} />
    </span>
  );
}
