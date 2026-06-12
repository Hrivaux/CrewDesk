/** Nom de dossier sûr à partir d'un nom de projet (« Site vitrine auto » → site-vitrine-auto). */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "projet";
}
