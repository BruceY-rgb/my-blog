export function withBase(pathname = "") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = pathname.replace(/^\//, "");
  return path ? `${base}/${path}` : `${base}/`;
}

export function termPath(kind: "tags" | "categories", term: string) {
  return withBase(`${kind}/${encodeURIComponent(termSlug(term))}/`);
}

export function termSlug(term: string) {
  return term.replaceAll("/", "--slash--");
}
