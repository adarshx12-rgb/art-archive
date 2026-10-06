/**
 * Legacy handwritten style summaries, distilled from the reference
 * images in inspiration/<slug> (kept locally, never shipped). The concept
 * and prompt models build from these moves and steer clear of the tells, so
 * their ideas look like the genre at its best rather than its average.
 *
 * These predate the complete per-image studies in worker/data/design-memory.json.
 * They are supplementary style notes, not a coverage report. The worker retrieves
 * specific evidence from the full collection, including folders with one image.
 */

export interface Inspiration {
  /** How many reference images this was distilled from. */
  studied: number;
  /** Recurring compositional moves in the strongest examples. Image-only: no lettering. */
  moves: string[];
  /** How the image itself is made. */
  image: string;
  /** Lettering moves and letterforms; only used when the visitor typed words. */
  lettering: { moves: string[]; letterforms: string };
  colour: string;
  finish: string;
  /** What weak, template or AI-made examples do. Never do these. */
  tells: string[];
}

export const inspiration: Record<string, Inspiration> = {
  "concert-poster": {
    studied: 23,
    moves: [
      "a lone performer small in a vast field of haze, light beams or crowd, so the scale of the venue becomes the subject",
      "the performer seen from behind or in silhouette, one arm raised toward the crowd",
      "a sea of crowd silhouettes and phone lights filling the bottom band, the performer rising out of it",
      "the performer cropped close and hard, filling the frame in one hot monochrome",
      "photographs layered in depth: a stage screen, the stage and the crowd stacked one in front of another",
    ],
    image: "real black-and-white live photography: blown highlights in the spotlight, crushed blacks, heavy haze; sometimes one hot monochrome (fire orange, blood red or magenta) replaces the greys",
    lettering: {
      moves: [
        "one giant title set wall to wall across the top third, the performer's head or raised arm overlapping its lower edge",
        "the title woven in depth: part of the photograph passes in front of the letters, the rest sits behind",
        "one short line repeated in a stacked rhythm, the repetition doing the work",
      ],
      letterforms: "one huge title as a shape: heavy condensed grotesque, a high-contrast display serif, or blackletter and brush for harder genres; any other words tiny and few",
    },
    colour: "monochrome on near-black or on paper white, or one hot monochrome across the whole image; colour never decorates",
    finish: "film grain, dust and fine scratches, photocopy texture on the light versions, a single stage lens flare",
    tells: [
      "corner clutter: barcodes, map coordinates, globe icons, dates, track lists and designer credits",
      "filler paragraphs of tiny body text",
      "the performer centred at medium size with nothing happening around them",
      "glossy, colourful stage lighting and clean gradients",
    ],
  },

  "film-still-poster": {
    studied: 20,
    moves: [
      "one face or figure from the film, cropped close and placed off-centre, with open space beside it",
      "a strip cut from the face, just the eyes, shifted out of line or recoloured like a censor bar",
      "the portrait reduced to one ink on one flat colour: duotone halftone, line-screen or engraved lines",
      "a cut-out figure against a patterned ground: paisley, textile or the film's own architecture",
      "the figure framed small inside a tall doorway or set, the rest of the frame left dark",
    ],
    image: "a cinematic still or studio portrait converted to print: halftone dots, line-screen, posterised black and white or a two-ink duotone, with soft ghosting on the black-and-white versions",
    lettering: {
      moves: [
        "the title as a tall stacked column down one side, beside the figure",
        "the title huge across the top, overlapping the hair or the top of the head",
        "the title in a flowing script cutting diagonally across the figure",
      ],
      letterforms: "a single title as the only large type: heavy grotesque, condensed display, an elegant high-contrast serif, a flowing script, or bold Devanagari when the title is Hindi; the accent colour on the title only",
    },
    colour: "black and white with one red title, or two-ink duotones: yellow on black, ink blue on cream, black on mustard or saffron",
    finish: "grain, paper texture, slight misregistration, bleeding ink, faint folds and wear",
    tells: [
      "full-colour glossy photography with a font laid on top",
      "paragraphs of synopsis text and blocks of credits",
      "the face centred with the title centred above it like a template",
    ],
  },

  "streetwear-poster": {
    studied: 22,
    moves: [
      "devotional or classical figures cut out in full colour against one flat, loud ground",
      "a deadpan everyday object or person given an iconic, monumental treatment",
      "a rich pattern ground (paisley, block print, carpet) framing one flat colour panel",
      "the figure cropped hard at the base and pushed up toward the top edge",
      "a single figure sliced from a painting and recoloured in one hot ink",
    ],
    image: "cut-out photographs or classical paintings with hard edges, often posterised or halftoned, or a flat graphic illustration of a figure in traditional dress",
    lettering: {
      moves: [
        "the quote set huge as the main image, the figure cut out and overlapping the letters",
        "one word repeated in rows behind the figure as a texture",
        "the quote stacked line by line, each line a different typeface, size and colour",
      ],
      letterforms: "heavy condensed grotesque capitals, bold italics and chunky display serifs mixed in one tightly set stack, with Devanagari only when the visitor's words are in it; one line in the accent colour",
    },
    colour: "one loud flat ground (poster red, saffron, ink blue or black) with paper white and one hit of yellow or coral; warm maroons and reds for textile grounds",
    finish: "fold creases, paper grain, photocopy grit and misprint on the cut-outs",
    tells: [
      "clean digital gradients and glossy 3D",
      "one tasteful typeface throughout",
      "real brand logos used as decoration",
    ],
  },

  gothic: {
    studied: 17,
    moves: [
      "a statue, angel or veiled figure in hard black and white, centred and monumental",
      "an ornate frame (baroque cartouche, oval mirror, filigree corners) enclosing the image",
      "a broadsheet layout used for horror: columns and one grainy photograph",
      "a strip of eyes or faces stacked down one side like film frames",
      "a full moon, crosses, thorns or bats as the only secondary motifs",
    ],
    image: "high-contrast black-and-white photography or engraving: statues, angels and veiled figures lit from above, or old engravings with a heavy halftone",
    lettering: {
      moves: [
        "a blackletter title spread wall to wall across the top, the figure rising into it",
        "the title running vertically down one side in a huge serif",
      ],
      letterforms: "blackletter, sharp flared serifs or thin elegant italics; one decisive title, any other lines very small",
    },
    colour: "black and bone white, with at most one accent: blood red or a cold violet",
    finish: "photocopy grain, scratched film, dust, crumpled paper, a faint red or violet wash",
    tells: [
      "glossy fantasy illustration with a purple glow",
      "Halloween clip art: cartoon bats, pumpkins and cobwebs",
      "track lists, parental-advisory badges and fake record labels",
    ],
  },

  grunge: {
    studied: 16,
    moves: [
      "a face or figure blown up as a high-contrast photocopy, its edges eaten away",
      "torn paper layers revealing a second image underneath",
      "photo strips and panels taped together like a fanzine spread",
      "a figure cropped tight and pushed hard against one edge",
    ],
    image: "photocopied black-and-white photographs: no mid-tones, toner noise, crushed blacks; occasionally a sepia or dried-red tint",
    lettering: {
      moves: [
        "huge distressed lettering bleeding off the edges, the figure in front of it",
        "hand-scrawled words running across the image",
      ],
      letterforms: "distressed condensed grotesque, scratchy handwriting, typewriter and dry brush script, letters chewed, cropped and overlapping",
    },
    colour: "black and dirty white, with at most one muted accent: dried red, sepia or bruise purple",
    finish: "toner specks, scratches, dust, creases, tape and xerox banding",
    tells: [
      "a clean photo with a digital grunge-texture overlay",
      "a neat, evenly spaced layout",
      "bright saturated colour",
    ],
  },

  "pop-art": {
    studied: 13,
    moves: [
      "a face cropped tight and blown up, built from flat colour and halftone",
      "radiating sunburst rays behind a head",
      "one figure in one-ink halftone printed over a single flat bright ground",
      "a dramatic comic-cover scene, one moment frozen at its peak",
      "a portrait framed like a playing card or a product label",
    ],
    image: "portraits and comic scenes with thick black outlines, flat fills and visible Ben-Day or halftone dots; photographs converted to one-ink halftone",
    lettering: {
      moves: ["one bold title block across the top, the image bursting up into it"],
      letterforms: "chunky comic display letters with an outline and drop shade, bold scripts or heavy condensed sans; big and few",
    },
    colour: "three or four flat saturated inks (red, yellow, cream, teal or violet) plus black",
    finish: "visible halftone dots, slight misregistration, faintly yellowed paper",
    tells: [
      "smooth digital shading instead of flat fills and dots",
      "too many colours",
      "speech bubbles and sound effects added as filler",
    ],
  },

  acid: {
    studied: 13,
    moves: [
      "a classical bust or face sliced into fragments, each fragment a different texture",
      "a face melting or dripping into liquid colour",
      "checkerboard, leopard print, radiating stripes and gradient bars collaged around one figure",
      "mirrored or doubled faces with beams of light from the eyes",
      "a surreal landscape crossed by a liquid neon river",
    ],
    image: "photographs collaged with heat-map, inverted and thermal colour, liquid marbled fills and chrome or gradient shapes",
    lettering: {
      moves: ["warped lettering bending around the scene in 3D, as if part of it"],
      letterforms: "warped bubble letters, stretched condensed grotesques, outlined 3D type and wavy outline type",
    },
    colour: "electric violet, acid green, hot pink and cyan against black, with thermal-camera gradients",
    finish: "grain, glitch, halftone, sticker and scan texture",
    tells: [
      "random clip art with no focal point",
      "evenly saturated mush with no darks to rest the eye",
    ],
  },

  "art-deco": {
    studied: 12,
    moves: [
      "a skyscraper or tower rising dead centre, framed by radiating searchlight rays",
      "a slim figure in a long gown, the dress forming strong vertical lines",
      "a stepped, symmetrical border with fan and sunburst motifs framing the scene",
      "a streamlined train or liner speeding diagonally through the frame",
      "a night city in gold light, reflected in wet streets",
    ],
    image: "flat stylised shapes, streamlined geometry and long verticals, figures elongated and elegant",
    lettering: {
      moves: ["the title in one band at the top or base, set wide and spaced out"],
      letterforms: "tall, thin geometric capitals with high waists, widely spaced",
    },
    colour: "black and metallic gold, or deep emerald or teal with gold and cream highlights",
    finish: "flat lithograph print, slightly worn, with foil-like gold",
    tells: [
      "gold-on-black clones with ornament on every edge",
      "slogans and filler words",
      "perfect symmetry with no single focal point",
    ],
  },

  retro: {
    studied: 23,
    moves: [
      "a big glamorous portrait cropped at the shoulders against sunburst rays",
      "one product shown huge beside a smiling figure, like a period advertisement",
      "a magazine-cover crop: a tight black-and-white face with one bold red block",
      "a tin-sign layout: a framed border around a single product",
      "a portrait recoloured in two inks with halftone, like a faded film card",
      "a postage stamp: a perforated edge around one face in one ink",
    ],
    image: "painted gouache illustration or offset-printed photography, warm and glamorous",
    lettering: {
      moves: ["the words in a ribbon, banner or arched band, part of the frame rather than floating on top"],
      letterforms: "brush scripts, slab and Western display faces and condensed sans, in ribbons and banners",
    },
    colour: "faded red, cream, mustard, teal and brown, aged and slightly sun-faded",
    finish: "worn paper, rust and chipped paint on tin, halftone dots and foxing",
    tells: [
      "overcrowded ads stacked with slogans",
      "misspelt brand names",
      "too-clean digital vector art",
    ],
  },

  "collage-art": {
    studied: 11,
    moves: [
      "a figure sliced into strips, one strip shifted or swapped for another source",
      "torn paper layers revealing different photographs beneath",
      "cut-out figures from different sources at clashing scales",
      "a grid of photo panels with one figure breaking out of it",
      "hand-drawn scribbles over a photographic collage",
    ],
    image: "cut-out photographs with visible edges from mixed sources, some halftone and some full colour",
    lettering: {
      moves: ["words cut from different magazines, layered into the collage like any other scrap"],
      letterforms: "cut magazine letters, condensed grotesques and scribbled handwriting, layered",
    },
    colour: "a black-and-white base with one or two loud accents: red, pink or acid green",
    finish: "paper texture, tape, torn edges and soft shadows from the layered paper",
    tells: [
      "everything at the same scale, evenly scattered",
      "digital smoothness with no paper edges",
    ],
  },
};

/** The inspiration a model sees for a style; lettering only when there are words to letter. */
export function inspirationFor(slug: string, hasWords: boolean) {
  const i = inspiration[slug];
  if (!i) return null;
  const { studied: _, lettering, ...rest } = i;
  return hasWords ? { ...rest, lettering } : rest;
}
