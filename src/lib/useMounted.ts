"use client";

import { useEffect, useState } from "react";

/** Vrai après le premier rendu client — évite les écarts SSR/hydratation. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
