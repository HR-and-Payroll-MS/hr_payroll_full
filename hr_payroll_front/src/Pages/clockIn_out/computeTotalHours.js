export default function computeTotalHours(punches) {
  let totalMs = 0;
  let lastIn = null;

  for (const p of punches) {
    if (p.type === 'check_in') lastIn = new Date(p.time);
    if (p.type === 'check_out' && lastIn) {
      totalMs += new Date(p.time) - lastIn;
      lastIn = null;
    }
  }

  const mins = Math.floor(totalMs / 60000);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  return `${hours}h ${remMins}m`;
}
