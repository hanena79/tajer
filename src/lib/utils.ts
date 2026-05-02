import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "MRU"): string {
  return new Intl.NumberFormat("ar-MR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string, locale = "ar"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MR" : "fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}
