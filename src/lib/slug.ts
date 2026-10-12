export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function placePath(name: string, id: number): string {
  return `${slugify(name) || "city"}-${id}`;
}

export function parsePlaceParam(
  param: string,
): { slug: string; id: number } | null {
  const match = /^(?:(.*)-)?(\d+)$/.exec(param);
  if (!match) return null;
  const id = Number(match[2]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { slug: match[1] ?? "", id };
}
