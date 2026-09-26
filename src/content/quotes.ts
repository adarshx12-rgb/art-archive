/**
 * Quotations used as interludes on the homepage.
 *
 * Only lines traceable to a named published source are included; popular
 * but unsourced "artist quotes" are deliberately left out. Where the
 * original continues past a dash, the quote stops at the end of the clause
 * rather than altering punctuation. Translations are noted.
 */
export interface Quote {
  id: string;
  text: string;
  author: string;
  /** Short descriptor shown with the name. */
  role: string;
  /** Where the words were published or recorded. */
  source: string;
  year: string;
  translated?: boolean;
}

export const quotes: Quote[] = [
  {
    id: "klee-visible",
    text: "Art does not reproduce the visible; rather, it makes visible.",
    author: "Paul Klee",
    role: "Painter",
    source: "Creative Confession",
    year: "1920",
    translated: true,
  },
  {
    id: "kandinsky-soul",
    text: "Colour is a power which directly influences the soul.",
    author: "Wassily Kandinsky",
    role: "Painter",
    source: "Concerning the Spiritual in Art",
    year: "1911",
    translated: true,
  },
  {
    id: "albers-relative",
    text: "In visual perception a color is almost never seen as it really is.",
    author: "Josef Albers",
    role: "Painter and teacher",
    source: "Interaction of Color",
    year: "1963",
  },
  {
    id: "okeeffe-shapes",
    text: "I found I could say things with color and shapes that I couldn’t say any other way.",
    author: "Georgia O’Keeffe",
    role: "Painter",
    source: "Georgia O’Keeffe",
    year: "1976",
  },
  {
    id: "klee-colour",
    text: "Colour and I are one. I am a painter.",
    author: "Paul Klee",
    role: "Painter",
    source: "Diary, Tunisia",
    year: "1914",
    translated: true,
  },
  {
    id: "sullivan-form",
    text: "Form ever follows function.",
    author: "Louis Sullivan",
    role: "Architect",
    source: "The Tall Office Building Artistically Considered",
    year: "1896",
  },
  {
    id: "degas-drawing",
    text: "Drawing is not form; it is the way of seeing form.",
    author: "Edgar Degas",
    role: "Painter, as recorded by Paul Valéry",
    source: "Degas Danse Dessin",
    year: "1936",
    translated: true,
  },
];

/**
 * Picks `count` different quotes, rotating daily so returning visitors see
 * new lines. Deterministic for a given date.
 */
export function quotesForDay(count: number, date = new Date()): Quote[] {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return Array.from({ length: Math.min(count, quotes.length) }, (_, i) => quotes[(day * count + i) % quotes.length]!);
}
