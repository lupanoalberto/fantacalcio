// utils/teamCode.ts
const STOP_WORDS = new Set([
  "fc", "cf", "ac", "sc", "cd", "ud", "sd", "ss",
  "as", "sv", "afc", "cfc", "bk",
  "de", "del", "della", "di", "da", "do", "dos", "das",
  "the", "and", "la", "le", "los", "las", "el",
  "sporting", "club", "calcio", "football",
]);

function normalizeName(name: string) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accenti
    .replace(/[^a-zA-Z0-9\s]/g, " ") // simboli -> spazi
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Genera un codice a 3 lettere "sensato" dal nome squadra.
 * - 1 parola: prime 3 lettere (JUVENTUS -> JUV)
 * - 2+ parole: iniziali delle parole "importanti" (Real Madrid -> RMA)
 *   se >3 prende le prime 3 iniziali; se <3 riempie con altre lettere.
 */
export function teamToCode3(name: string): string {
  const cleaned = normalizeName(name);
  if (!cleaned) return "???";

  const rawParts = cleaned.split(" ").filter(Boolean);

  // filtra stop words
  const parts = rawParts.filter((p) => !STOP_WORDS.has(p.toLowerCase()));

  const use = parts.length ? parts : rawParts; // se filtra tutto, usa originale

  // Se resta 1 parola: prime 3 lettere
  if (use.length === 1) {
    const w = use[0];
    const code = w.slice(0, 3).toUpperCase();
    return code.padEnd(3, w.slice(0, 3).toUpperCase());
  }

  // 2+ parole: prendi iniziali
  let initials = use.map((w) => w[0]).join("").toUpperCase();

  // se troppe, taglia a 3
  if (initials.length >= 3) return initials.slice(0, 3);

  // se poche (es. "Al Nassr" -> AN), riempi con lettere della prima parola
  const first = use[0].toUpperCase();
  const needed = 3 - initials.length;
  initials += first.slice(1, 1 + needed);

  return initials.slice(0, 3);
}
