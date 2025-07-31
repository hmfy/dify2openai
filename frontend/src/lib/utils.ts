import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num)
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'success':
    case 'active':
    case 'online':
      return 'text-success'
    case 'error':
    case 'failed':
    case 'offline':
      return 'text-error'
    case 'warning':
    case 'pending':
      return 'text-warning'
    case 'info':
    case 'processing':
      return 'text-info'
    default:
      return 'text-muted-foreground'
  }
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}