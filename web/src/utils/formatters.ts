export const formatCOP = (amount: number): string =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(amount);
// → "$15.000"

export const formatDate = (date: string | Date): string =>
    new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Bogota',
    }).format(new Date(date));
// → "18 mar 2026, 6:30 p. m."

export const formatDateOnly = (date: string | Date): string =>
    new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeZone: 'America/Bogota',
    }).format(new Date(date));
// → "18 mar 2026"

export const formatTimeOnly = (date: string | Date): string =>
    new Intl.DateTimeFormat('es-CO', {
        timeStyle: 'short',
        timeZone: 'America/Bogota',
    }).format(new Date(date));
// → "6:30 p. m."