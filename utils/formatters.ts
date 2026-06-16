import { Service } from '@/types/booking';

export const formatPrice = (price: number) => {
  return price.toLocaleString('vi-VN') + 'đ';
};

export const parseHoursFromDuration = (duration?: string) => {
  if (!duration) return 0;
  const parts = duration.split('-').map(s => s.trim());
  if (parts.length !== 2) return 0;
  const toMinutes = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + (mm || 0);
  };
  const mins = toMinutes(parts[1]) - toMinutes(parts[0]);
  return Math.max(0, Math.round(mins / 60));
};

export const calculateTotalServices = (services: Service[]) => {
  if (!services) return 0;
  return services.reduce((total, s) => total + (s.qty * s.price), 0);
};

export const getFormattedDate = (dateString: string) => {
  if (!dateString) return '';
  if (dateString.includes('-')) {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  }
  const [d, m, y] = dateString.split('/');
  return `${d}/${m}/${y}`;
};

export const parseBookingDate = (bookingDateStr?: string): Date | null => {
  if (!bookingDateStr) return null;
  const [datePart] = bookingDateStr.trim().split(/[T\s]+/);
  const [y, m, d] = datePart.includes('-')
    ? datePart.split('-').map(Number)
    : datePart.split('/').map(Number).reverse();
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
};

export const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

export const findStringByKeys = (value: unknown, keys: string[]): string => {
  if (!value || typeof value !== 'object') return '';
  const blockedKeys = new Set(['services', 'items', 'products']);
  const normalizedKeys = keys.map(key => key.toLowerCase());
  const stack = [value as Record<string, unknown>];
  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    for (const [key, nestedValue] of Object.entries(current)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKeys.includes(normalizedKey) && typeof nestedValue === 'string' && nestedValue.trim()) {
        return nestedValue.trim();
      }
      if (nestedValue && typeof nestedValue === 'object' && !blockedKeys.has(normalizedKey)) {
        stack.push(nestedValue as Record<string, unknown>);
      }
    }
  }
  return '';
};