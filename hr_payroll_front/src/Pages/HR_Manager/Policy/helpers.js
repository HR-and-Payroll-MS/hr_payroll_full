export const getNested = (obj, path) => {
  if (!path) return obj;
  const parts = path.replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`).split(".").filter(Boolean);
  let cur = obj;
  for (let p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

export const setNested = (obj, path, value) => {
  const parts = path.replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`).split(".").filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
};

