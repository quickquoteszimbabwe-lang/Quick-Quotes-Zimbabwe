import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `USD $${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "open": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-yellow-100 text-yellow-800";
    case "completed": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "paid": return "bg-green-100 text-green-800";
    case "released": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
}
