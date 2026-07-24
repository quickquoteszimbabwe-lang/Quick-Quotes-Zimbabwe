import {
  HardHat, Droplet, Wrench, Zap, Hammer, Flame, Layers,
  Sparkles, Trees, Wheat, Truck, Car, CarFront, Home,
  Shield, Scissors, Shirt, PartyPopper, GraduationCap,
  HeartPulse, Briefcase, Laptop, Printer, Settings, Users,
  Dog, Landmark, Plane, Box, Package, Camera,
  type LucideIcon,
} from "lucide-react";

// Maps icon name strings stored in the DB to Lucide icon components
export const ICON_MAP: Record<string, LucideIcon> = {
  HardHat,
  Droplet,
  Wrench,
  Zap,
  Hammer,
  Flame,
  Layers,
  Sparkles,
  Trees,
  Wheat,
  Truck,
  Car,
  CarFront,
  Home,
  Shield,
  Scissors,
  Shirt,
  PartyPopper,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Laptop,
  Printer,
  Cog: Settings,
  Users,
  Dog,
  Landmark,
  Plane,
  Boxes: Box,
  Package,
  Camera,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Package;
}

// Color palette indexed by sort_order mod 10 for visual variety
const COLOR_PALETTE = [
  { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200", iconBg: "bg-blue-100", badge: "bg-blue-100 text-blue-700" },
  { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-200", iconBg: "bg-cyan-100", badge: "bg-cyan-100 text-cyan-700" },
  { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-200", iconBg: "bg-indigo-100", badge: "bg-indigo-100 text-indigo-700" },
  { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-200", iconBg: "bg-yellow-100", badge: "bg-yellow-100 text-yellow-700" },
  { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200", iconBg: "bg-amber-100", badge: "bg-amber-100 text-amber-700" },
  { bg: "bg-red-50", icon: "text-red-600", border: "border-red-200", iconBg: "bg-red-100", badge: "bg-red-100 text-red-700" },
  { bg: "bg-sky-50", icon: "text-sky-600", border: "border-sky-200", iconBg: "bg-sky-100", badge: "bg-sky-100 text-sky-700" },
  { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200", iconBg: "bg-purple-100", badge: "bg-purple-100 text-purple-700" },
  { bg: "bg-green-50", icon: "text-green-600", border: "border-green-200", iconBg: "bg-green-100", badge: "bg-green-100 text-green-700" },
  { bg: "bg-lime-50", icon: "text-lime-600", border: "border-lime-200", iconBg: "bg-lime-100", badge: "bg-lime-100 text-lime-700" },
  { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200", iconBg: "bg-orange-100", badge: "bg-orange-100 text-orange-700" },
  { bg: "bg-zinc-50", icon: "text-zinc-600", border: "border-zinc-200", iconBg: "bg-zinc-100", badge: "bg-zinc-100 text-zinc-700" },
  { bg: "bg-rose-50", icon: "text-rose-600", border: "border-rose-200", iconBg: "bg-rose-100", badge: "bg-rose-100 text-rose-700" },
  { bg: "bg-teal-50", icon: "text-teal-600", border: "border-teal-200", iconBg: "bg-teal-100", badge: "bg-teal-100 text-teal-700" },
  { bg: "bg-slate-50", icon: "text-slate-600", border: "border-slate-200", iconBg: "bg-slate-100", badge: "bg-slate-100 text-slate-700" },
  { bg: "bg-pink-50", icon: "text-pink-600", border: "border-pink-200", iconBg: "bg-pink-100", badge: "bg-pink-100 text-pink-700" },
  { bg: "bg-fuchsia-50", icon: "text-fuchsia-600", border: "border-fuchsia-200", iconBg: "bg-fuchsia-100", badge: "bg-fuchsia-100 text-fuchsia-700" },
  { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-200", iconBg: "bg-violet-100", badge: "bg-violet-100 text-violet-700" },
  { bg: "bg-blue-50", icon: "text-blue-700", border: "border-blue-200", iconBg: "bg-blue-100", badge: "bg-blue-100 text-blue-800" },
  { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200", iconBg: "bg-emerald-100", badge: "bg-emerald-100 text-emerald-700" },
];

export function getCategoryColor(sortOrder: number) {
  return COLOR_PALETTE[(sortOrder - 1) % COLOR_PALETTE.length];
}
