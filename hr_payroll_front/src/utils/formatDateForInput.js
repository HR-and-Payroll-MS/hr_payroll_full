  export const formatDateForInput = (dateString) => {
  if (!dateString) return "";

  // Already valid?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  // Try to auto-convert any "d-m-yy" format
  const parts = dateString.split("-");
  if (parts.length === 3) {
    let [y, m, d] = parts;

    // If year is short (2 digits), guess the full year
    if (y.length === 2) y = "20" + y;
    if (y.length === 1) y = "200" + y;

    // Ensure MM and DD are 2-digit
    if (m.length === 1) m = "0" + m;
    if (d.length === 1) d = "0" + d;

    return `${y}-${m}-${d}`;
  }

  return "";
};