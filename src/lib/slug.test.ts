import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("met en minuscules et remplace les espaces par des tirets", () => {
    expect(slugify("Site Vitrine Auto")).toBe("site-vitrine-auto");
  });

  it("retire les accents et la ponctuation", () => {
    expect(slugify("Café Élégant !")).toBe("cafe-elegant");
  });

  it("ne laisse pas de tirets en bord", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });

  it("borne la longueur à 48 caractères", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(48);
  });

  it("retombe sur « projet » si vide après nettoyage", () => {
    expect(slugify("!!!")).toBe("projet");
    expect(slugify("")).toBe("projet");
  });

  it("produit un slug accepté par la garde de dossier projet", () => {
    const re = /^[a-z0-9][a-z0-9-]{0,47}$/;
    for (const name of ["Mon Projet 2026", "Étude de marché", "API & SDK"]) {
      expect(re.test(slugify(name))).toBe(true);
    }
  });
});
