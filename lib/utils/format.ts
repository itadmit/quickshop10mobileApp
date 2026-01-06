import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { he } from 'date-fns/locale';

// ============ Currency Formatting ============
export function formatCurrency(amount: number, currency: string = 'ILS'): string {
  if (currency === 'ILS' || currency === '₪') {
    return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============ Date Formatting ============
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return format(d, 'dd/MM/yyyy', { locale: he });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return format(d, 'dd/MM/yyyy HH:mm', { locale: he });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return format(d, 'HH:mm', { locale: he });
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  
  if (isToday(d)) {
    return `היום ${format(d, 'HH:mm')}`;
  }
  
  if (isYesterday(d)) {
    return `אתמול ${format(d, 'HH:mm')}`;
  }
  
  // Within a week
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return formatDistanceToNow(d, { addSuffix: true, locale: he });
  }
  
  return format(d, 'dd/MM/yyyy', { locale: he });
}

// ============ Number Formatting ============
export function formatNumber(num: number): string {
  return num.toLocaleString('he-IL');
}

export function formatPercent(num: number, decimals: number = 0): string {
  return `${num.toFixed(decimals)}%`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// ============ Order Status ============
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתינה',
  confirmed: 'אושרה',
  processing: 'בטיפול',
  shipped: 'נשלחה',
  delivered: 'נמסרה',
  cancelled: 'בוטלה',
  refunded: 'זוכתה',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

export const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  unfulfilled: 'לא נשלח',
  partial: 'נשלח חלקית',
  fulfilled: 'נשלח',
};

export const FINANCIAL_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  partially_paid: 'שולם חלקית',
  refunded: 'זוכה',
  partially_refunded: 'זוכה חלקית',
};

// ============ Phone Formatting ============
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Israeli phone format
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}${digits.slice(6)}`;
  }
  
  return phone;
}

// ============ Address Formatting ============
export function formatAddress(address: {
  street?: string;
  houseNumber?: string;
  apartment?: string;
  floor?: string;
  city?: string;
  zipCode?: string;
}): string {
  const parts: string[] = [];
  
  if (address.street) {
    let streetLine = address.street;
    if (address.houseNumber) {
      streetLine += ` ${address.houseNumber}`;
    }
    parts.push(streetLine);
  }
  
  if (address.apartment) {
    parts.push(`דירה ${address.apartment}`);
  }
  
  if (address.floor) {
    parts.push(`קומה ${address.floor}`);
  }
  
  if (address.city) {
    let cityLine = address.city;
    if (address.zipCode) {
      cityLine += `, ${address.zipCode}`;
    }
    parts.push(cityLine);
  }
  
  return parts.join(', ');
}

