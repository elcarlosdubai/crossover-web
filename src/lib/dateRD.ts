/**
 * Utilidades de fecha y hora fijadas en República Dominicana (America/Santo_Domingo, UTC-4).
 * Evita que cobros o cierres hechos después de las 8:00 PM RD cambien al día siguiente por UTC.
 */

const RD_TIMEZONE = "America/Santo_Domingo";

export function getTodayRD(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getRDYear(date: Date = new Date()): number {
  const parts = getTodayRD(date).split("-");
  return Number(parts[0]) || date.getFullYear();
}

export function getDayRangeUTCRangeForRD(fechaRD?: string): {
  fechaRD: string;
  startISO: string;
  endISO: string;
} {
  const target = fechaRD || getTodayRD();
  // República Dominicana es UTC-4 fijo todo el año (sin horario de verano)
  const startISO = `${target}T04:00:00.000Z`;
  const nextDay = new Date(`${target}T04:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  nextDay.setUTCMilliseconds(nextDay.getUTCMilliseconds() - 1);
  return {
    fechaRD: target,
    startISO,
    endISO: nextDay.toISOString(),
  };
}

export function formatDateTimeRD(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleString("es-DO", {
    timeZone: RD_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDateTimeLocalRD(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}
