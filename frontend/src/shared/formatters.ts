export function formatINR(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'Unspecified';
  if (val === 0) return '₹0';
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (val >= 100000) {
    const lk = val / 100000;
    return `₹${lk.toFixed(lk % 1 === 0 ? 0 : 2)} Lakh`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
