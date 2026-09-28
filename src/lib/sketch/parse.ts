/**
 * Reads a free-text subject ("two women dancing on a beach at sunset") and
 * picks out the things the storyboard sketch can draw. Deliberately simple:
 * a word list, counts and a few poses. Unknown words are ignored.
 */

export type Glyph =
  | "person"
  | "child"
  | "robot"
  | "animal"
  | "big-animal"
  | "bird"
  | "fish"
  | "car"
  | "bike"
  | "boat"
  | "train"
  | "plane"
  | "house"
  | "tower"
  | "lighthouse"
  | "castle"
  | "city"
  | "tree"
  | "palm"
  | "flower"
  | "mountain"
  | "hill"
  | "sun"
  | "moon"
  | "star"
  | "planet"
  | "cloud"
  | "table"
  | "chair"
  | "book"
  | "cup"
  | "candle"
  | "lamp"
  | "window"
  | "door"
  | "sword"
  | "guitar"
  | "device"
  | "bottle"
  | "bed";

/** Where an item lives in the frame. */
export type Layer = "sky" | "back" | "front";

export type Pose = "stand" | "walk" | "run" | "sit" | "dance" | "lie";

export interface SketchItem {
  glyph: Glyph;
  /** The word as the user wrote it, singular. */
  label: string;
  count: number;
  layer: Layer;
}

export interface Scene {
  items: SketchItem[];
  pose: Pose;
  interior: boolean;
  water: boolean;
}

const LAYER: Record<Glyph, Layer> = {
  person: "front", child: "front", robot: "front", animal: "front", "big-animal": "front", fish: "front",
  car: "front", bike: "front", boat: "front", train: "front",
  table: "front", chair: "front", book: "front", cup: "front", candle: "front", lamp: "front", sword: "front",
  guitar: "front", device: "front", bottle: "front", bed: "front", flower: "front",
  house: "back", tower: "back", lighthouse: "back", castle: "back", city: "back", tree: "back", palm: "back",
  mountain: "back", hill: "back", window: "back", door: "back",
  sun: "sky", moon: "sky", star: "sky", planet: "sky", cloud: "sky", bird: "sky", plane: "sky",
};

/** [glyph, singular words, plural words]. Plurals default to a count of 3. */
const WORDS: [Glyph, string[], string[]][] = [
  ["person", ["person", "man", "woman", "figure", "dancer", "singer", "musician", "knight", "soldier", "king", "queen", "prince", "princess", "astronaut", "detective", "keeper", "farmer", "worker", "student", "teacher", "doctor", "nurse", "witch", "wizard", "pirate", "cowboy", "grandmother", "grandfather", "mother", "father", "friend", "traveller", "traveler", "model", "athlete", "skater", "surfer", "rider", "portrait", "lady", "gentleman", "character", "hero", "villain", "warrior", "monk", "nun", "priest", "chef", "artist", "painter", "boxer", "player", "statue", "sculpture", "angel", "ghost", "mannequin", "saint", "goddess", "god"], ["people", "men", "women", "figures", "dancers", "singers", "musicians", "knights", "soldiers", "friends", "travellers", "travelers", "models", "athletes", "skaters", "surfers", "riders", "warriors", "players", "artists", "statues", "sculptures", "angels", "ghosts", "mannequins"]],
  ["child", ["child", "kid", "girl", "boy", "baby", "toddler"], ["children", "kids", "girls", "boys", "babies"]],
  ["robot", ["robot", "android", "cyborg"], ["robots", "androids", "cyborgs"]],
  ["animal", ["dog", "cat", "fox", "wolf", "rabbit", "puppy", "kitten", "animal", "sheep", "goat", "pig"], ["dogs", "cats", "foxes", "wolves", "rabbits", "puppies", "kittens", "animals", "goats", "pigs"]],
  ["big-animal", ["horse", "cow", "deer", "bear", "lion", "tiger", "elephant", "camel", "giraffe", "unicorn", "dragon"], ["horses", "cows", "bears", "lions", "tigers", "elephants", "camels", "giraffes", "dragons"]],
  ["bird", ["bird", "raven", "crow", "owl", "eagle", "dove", "seagull", "gull", "parrot", "swan"], ["birds", "ravens", "crows", "owls", "eagles", "doves", "seagulls", "gulls", "parrots", "swans"]],
  ["fish", ["fish", "whale", "dolphin", "shark"], ["whales", "dolphins", "sharks"]],
  ["car", ["car", "taxi", "truck", "van", "jeep", "bus"], ["cars", "taxis", "trucks", "vans", "buses"]],
  ["bike", ["bicycle", "bike", "motorcycle", "motorbike", "scooter"], ["bicycles", "bikes", "motorcycles", "scooters"]],
  ["boat", ["boat", "ship", "sailboat", "yacht", "canoe"], ["boats", "ships", "sailboats", "yachts"]],
  ["train", ["train", "tram", "subway"], ["trains", "trams"]],
  ["plane", ["plane", "airplane", "aeroplane", "jet", "spaceship", "rocket", "ufo"], ["planes", "jets", "spaceships", "rockets"]],
  ["house", ["house", "cottage", "cabin", "hut", "home", "shop", "cafe", "café", "diner", "barn", "building"], ["houses", "cottages", "cabins", "shops", "buildings"]],
  ["tower", ["tower", "cathedral", "church", "temple", "palace", "skyscraper", "windmill", "monument"], ["towers", "churches", "temples", "skyscrapers"]],
  ["lighthouse", ["lighthouse"], ["lighthouses"]],
  ["castle", ["castle", "fortress"], ["castles"]],
  ["city", ["city", "skyline", "town", "street", "village", "downtown"], ["cities", "streets"]],
  ["tree", ["tree", "forest", "woods", "oak", "pine", "garden", "park", "jungle"], ["trees", "oaks", "pines"]],
  ["palm", ["palm"], ["palms"]],
  ["flower", ["flower", "rose", "tulip", "plant", "bouquet", "sunflower"], ["flowers", "roses", "tulips", "plants"]],
  ["mountain", ["mountain", "volcano", "peak", "cliff", "glacier"], ["mountains", "peaks", "cliffs"]],
  ["hill", ["hill", "dune", "field", "meadow", "desert", "valley"], ["hills", "dunes", "fields", "meadows"]],
  ["sun", ["sun", "sunset", "sunrise", "dawn", "dusk"], []],
  ["moon", ["moon", "crescent"], ["moons"]],
  ["star", ["star", "galaxy", "space", "cosmos"], ["stars"]],
  ["planet", ["planet", "saturn"], ["planets"]],
  ["cloud", ["cloud", "storm", "fog", "mist"], ["clouds"]],
  ["table", ["table", "desk", "counter"], ["tables", "desks"]],
  ["chair", ["chair", "sofa", "couch", "bench", "throne", "armchair", "stool"], ["chairs", "benches", "stools"]],
  ["book", ["book", "newspaper", "letter", "map", "notebook"], ["books", "letters", "maps"]],
  ["cup", ["cup", "mug", "coffee", "tea", "glass", "wine"], ["cups", "mugs", "glasses"]],
  ["candle", ["candle"], ["candles"]],
  ["lamp", ["lamp", "lantern", "streetlight", "torch"], ["lamps", "lanterns", "streetlights", "torches"]],
  ["window", ["window"], ["windows"]],
  ["door", ["door", "doorway", "gate", "arch", "archway", "portal"], ["doors", "gates", "arches"]],
  ["sword", ["sword", "spear", "staff", "wand", "dagger"], ["swords", "spears"]],
  ["guitar", ["guitar", "violin", "cello", "bass"], ["guitars", "violins"]],
  ["device", ["phone", "smartphone", "laptop", "computer", "screen", "tv", "television", "camera", "tablet", "radio"], ["phones", "laptops", "computers", "screens", "cameras"]],
  ["bottle", ["bottle", "vase", "jar", "perfume", "potion"], ["bottles", "vases", "jars"]],
  ["bed", ["bed"], ["beds"]],
];

/** Collective words that stand for several people. */
const GROUPS: Record<string, [Glyph, string, number]> = {
  couple: ["person", "person", 2],
  family: ["person", "person", 4],
  crowd: ["person", "person", 6],
  band: ["person", "person", 4],
  team: ["person", "person", 5],
};

const NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, single: 1, lone: 1, two: 2, pair: 2, both: 2, twin: 2, twins: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, few: 3, several: 3, some: 3, many: 5, group: 5,
};

const INTERIOR = new Set(["room", "kitchen", "bedroom", "bathroom", "studio", "office", "library", "interior", "inside", "indoors", "hall", "hallway", "classroom", "bar", "restaurant", "museum", "gallery", "attic", "cellar", "corridor"]);
const WATER = new Set(["sea", "ocean", "lake", "river", "beach", "shore", "waves", "pool", "harbour", "harbor", "bay", "coast", "underwater", "pond"]);

const POSES: [Pose, RegExp][] = [
  ["lie", /\b(lying|lies|lie|sleeping|sleeps|asleep|resting|reclining)\b/],
  ["sit", /\b(sitting|sits|sit|seated|reading|reads|kneeling|writing)\b/],
  ["run", /\b(running|runs|run|racing|sprinting|chasing|fleeing)\b/],
  ["dance", /\b(dancing|dances|dance|jumping|jumps|celebrating|cheering)\b/],
  ["walk", /\b(walking|walks|walk|strolling|wandering|marching|hiking)\b/],
];

const lookup = new Map<string, { glyph: Glyph; singular: string; plural: boolean }>();
for (const [glyph, singles, plurals] of WORDS) {
  singles.forEach((w) => lookup.set(w, { glyph, singular: w, plural: false }));
  plurals.forEach((w, i) => lookup.set(w, { glyph, singular: singles[i] ?? singles[0]!, plural: true }));
}

const MAX_COUNT = 6;

export function parseSubject(text: string): Scene {
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-z0-9àâäéèêëïîôöùûüç]+/).filter(Boolean);
  const byLabel = new Map<string, SketchItem>();

  words.forEach((word, i) => {
    const group = GROUPS[word];
    // "palm trees" are palms, not palms and trees.
    if ((word === "tree" || word === "trees") && words[i - 1] === "palm") {
      const palm = byLabel.get("palm");
      if (palm && word === "trees") palm.count = Math.max(palm.count, 3);
      return;
    }
    const hit = group ? { glyph: group[0], singular: group[1], plural: true } : lookup.get(word);
    if (!hit) return;
    // A number up to three words back applies ("two old fishermen").
    let count = group ? group[2] : hit.plural ? 3 : 1;
    for (let back = 1; back <= 3 && i - back >= 0; back++) {
      const w = words[i - back]!;
      const n = /^\d+$/.test(w) ? Number(w) : NUMBERS[w];
      if (n !== undefined && !(group && n === 1)) {
        count = n;
        break;
      }
      if (lookup.has(w) || GROUPS[w]) break;
    }
    count = Math.max(1, Math.min(MAX_COUNT, count));
    const existing = byLabel.get(hit.singular);
    if (existing) existing.count = Math.min(MAX_COUNT, Math.max(existing.count, count));
    else byLabel.set(hit.singular, { glyph: hit.glyph, label: hit.singular, count, layer: LAYER[hit.glyph] });
  });

  return {
    items: [...byLabel.values()],
    pose: POSES.find(([, re]) => re.test(lower))?.[0] ?? "stand",
    interior: words.some((w) => INTERIOR.has(w)),
    water: words.some((w) => WATER.has(w)),
  };
}
