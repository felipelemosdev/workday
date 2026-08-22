import { format, parseISO, isToday, isSameDay, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, getDay, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmt = (date, pattern) => {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, pattern, { locale: ptBR });
  } catch {
    return "";
  }
};

export const toISO = (date) => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return d.toISOString();
};

export const isSameDayStr = (a, b) => {
  const da = typeof a === "string" ? parseISO(a) : a;
  const db = typeof b === "string" ? parseISO(b) : b;
  return isSameDay(da, db);
};

export {
  parseISO,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isWithinInterval,
  getDay,
  setHours,
  setMinutes,
};

export const weekStart = (date) => startOfWeek(date, { weekStartsOn: 1 });
export const weekEnd = (date) => endOfWeek(date, { weekStartsOn: 1 });

export const maskCPF = (cpf = "") => {
  const digits = String(cpf).replace(/\D/g, "");
  if (digits.length < 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.***-**`;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);