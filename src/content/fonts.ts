/**
 * Suggested fonts per style. Free fonts are all on Google Fonts (open
 * licences, fine for commercial use); paid fonts need a licence from the
 * foundry or a reseller. Only styles with covers have suggestions so far.
 */

export type FontLicence = "free" | "paid";
export type FontRole = "Headlines" | "Body" | "Details";

export interface FontSuggestion {
  family: string;
  licence: FontLicence;
  role: FontRole;
  /** Why it suits the style. */
  why: string;
  /** Where to get it. */
  source: string;
  url: string;
}

const free = (family: string, role: FontRole, why: string): FontSuggestion => ({
  family,
  licence: "free",
  role,
  why,
  source: "Google Fonts",
  url: `https://fonts.google.com/specimen/${family.replace(/ /g, "+")}`,
});

const paid = (family: string, role: FontRole, why: string, source: string, url?: string): FontSuggestion => ({
  family,
  licence: "paid",
  role,
  why,
  source,
  url: url ?? `https://www.myfonts.com/search?query=${encodeURIComponent(family)}`,
});

export const fontSuggestions: Record<string, FontSuggestion[]> = {
  swiss: [
    free("Inter Tight", "Headlines", "A tightly spaced neo-grotesque in the Helvetica mould, made for large settings."),
    free("Inter", "Body", "The same design for small text: neutral, clear and even."),
    free("Archivo", "Details", "A grotesque with a slightly older, Akzidenz-like feel for captions and dates."),
    paid("Akzidenz-Grotesk", "Headlines", "The 1896 grotesque the Swiss designers actually set their posters in.", "Berthold"),
    paid("Helvetica Now", "Body", "The 1957 Basel typeface most tied to the style, redrawn for today.", "Monotype"),
  ],
  bauhaus: [
    free("Jost", "Headlines", "A Futura-style geometric sans: circles, triangles and straight lines."),
    free("Josefin Sans", "Details", "Geometric with high-waisted capitals and a 1920s feel."),
    free("Syne", "Headlines", "Wide, heavy weights that act as building blocks, as Bauhaus type did."),
    paid("Architype Bayer", "Headlines", "A digital version of Herbert Bayer's lowercase 'universal' alphabet.", "The Foundry", "https://www.thefoundrytypes.com/fonts/architype-bayer/"),
    paid("Futura PT", "Body", "Paul Renner's 1927 geometric sans, a direct outgrowth of Bauhaus ideas.", "ParaType", "https://www.paratype.com"),
  ],
  "gen-x-soft-club": [
    free("Michroma", "Headlines", "Wide, squared letters in the spirit of Microgramma: calm, clean futurism."),
    free("Manrope", "Body", "A soft modern sans that keeps text quiet and airy."),
    free("Doto", "Details", "Dot-matrix letters for the transit-sign and display details of the look."),
    paid("Eurostile", "Headlines", "Novarese's squared sans, the default voice of late-90s tech and transit.", "Linotype"),
    paid("Helvetica Now", "Body", "Clean, neutral sans for minimal, spacious layouts.", "Monotype"),
  ],
  "art-deco": [
    free("Limelight", "Headlines", "High-contrast display capitals in the Broadway manner."),
    free("Poiret One", "Headlines", "A thin, geometric Deco display face with elegant rounded forms."),
    free("Josefin Sans", "Body", "Geometric with a 1920s flavour; readable for supporting text."),
    paid("Broadway", "Headlines", "Morris Fuller Benton's 1929 face, arguably the most iconic Deco display type.", "Monotype"),
    paid("Peignot", "Headlines", "Cassandre's 1937 typeface with tall, mixed-case letterforms.", "Linotype"),
  ],
  vaporwave: [
    free("Noto Sans JP", "Details", "Clean katakana and kanji for the Japanese text the style relies on."),
    free("VT323", "Details", "A terminal-style bitmap font for early-OS and VHS details."),
    free("Tinos", "Headlines", "A Times-style serif for the ironic, stretched 'corporate' titles."),
    paid("Eurostile", "Headlines", "Wide 80s/90s tech lettering, often stretched into fullwidth titles.", "Linotype"),
    paid("Times New Roman", "Headlines", "The default system serif that vaporwave repurposes.", "Monotype"),
  ],
  "collage-art": [
    free("Abril Fatface", "Headlines", "A heavy Didone like the fat-face headlines cut from old newspapers."),
    free("Bebas Neue", "Headlines", "Tall condensed capitals, like clipped poster and ticket type."),
    free("Special Elite", "Details", "Typewriter letters with worn ink for labels and scraps."),
    free("Old Standard TT", "Body", "A 19th-century book face for text snippets pasted into the collage."),
    paid("ITC Franklin Gothic", "Headlines", "The American gothic of newspapers and ads that Dada artists cut up.", "ITC / Monotype"),
    paid("Clarendon", "Headlines", "A heavy Victorian slab serif from old posters and handbills.", "Linotype"),
  ],
  cyberminimalism: [
    free("Space Grotesk", "Headlines", "A precise grotesque with quirky technical details."),
    free("JetBrains Mono", "Details", "A clean monospace for data, labels and code-like text."),
    free("Geist Mono", "Details", "A cool, modern monospace for small UI text."),
    paid("Söhne", "Headlines", "A refined grotesque that reads as calm, expensive technology.", "Klim Type Foundry", "https://klim.co.nz"),
    paid("GT America Mono", "Details", "A crisp monospace companion for technical details.", "Grilli Type", "https://www.grillitype.com"),
  ],
  steampunk: [
    free("Ultra", "Headlines", "A fat Clarendon-style slab serif, as on Victorian posters."),
    free("IM Fell English", "Body", "A revival of 17th-century printing type with an aged, inky feel."),
    free("Cinzel Decorative", "Details", "Engraved capitals with flourishes for plaques and brass labels."),
    paid("Clarendon", "Headlines", "The 1845 slab serif at the heart of Victorian display typography.", "Linotype"),
    paid("Mrs Eaves", "Body", "A warm Baskerville revival with an old-world, bookish feel.", "Emigre", "https://www.emigre.com"),
  ],
  y2k: [
    free("Orbitron", "Headlines", "Geometric, space-age capitals for chrome and techno headlines."),
    free("Michroma", "Headlines", "Wide Microgramma-style letters, a Y2K tech staple."),
    free("Audiowide", "Details", "Rounded techno letters for logos and UI badges."),
    paid("Eurostile", "Headlines", "Its Extended widths defined late-90s headlines, logos and interfaces.", "Linotype"),
    paid("FF Blur", "Headlines", "Neville Brody's 1992 soft-focus sans, a key rule-breaking face of the era.", "Monotype (FontFont)"),
    paid("Bank Gothic", "Details", "Benton's 1930 squared capitals, revived in the Y2K era.", "Bitstream"),
  ],
  psychedelic: [
    free("Shrikhand", "Headlines", "Bold, swelling display letters with a groovy 60s–70s rhythm."),
    free("Kablammo", "Headlines", "Wobbling, morphing forms that echo melting poster lettering."),
    free("Righteous", "Details", "Rounded retro display letters for dates and venues."),
    paid("Wes Wilson", "Headlines", "Based on the lettering of the pioneer of the 1960s psychedelic poster.", "K-Type", "https://www.k-type.com/fonts/wes-wilson/"),
    paid("Arnold Böcklin", "Headlines", "A 1904 Art Nouveau face that psychedelic posters revived in the 60s.", "URW"),
  ],
  memphis: [
    free("Bungee", "Headlines", "Blocky, geometric display letters with a bold, playful stance."),
    free("Rubik", "Body", "Slightly rounded geometry that matches Memphis's friendly shapes."),
    free("Fredoka", "Details", "Round, bouncy letters for bubbly accents."),
    paid("ITC Avant Garde Gothic", "Headlines", "The geometric sans of 70s–80s design, with tight, shape-like letters.", "ITC / Monotype"),
    paid("Futura PT", "Body", "Clean geometry that sits well beside loud patterns.", "ParaType", "https://www.paratype.com"),
  ],
  "art-nouveau": [
    free("Federo", "Headlines", "Display capitals with the soft, organic curves of Jugendstil lettering."),
    free("Cormorant Garamond", "Body", "An elegant, high-contrast serif for text around ornament."),
    free("Marcellus", "Details", "Flared, inscriptional capitals suited to decorative frames."),
    paid("Arnold Böcklin", "Headlines", "Probably the best-known Art Nouveau typeface (1904), with botanical flourishes.", "URW"),
    paid("Auriol", "Headlines", "George Auriol's brush-like 1901 face, used on Paris Métro signage.", "Linotype"),
  ],
  synthwave: [
    free("Monoton", "Headlines", "Multi-line neon-tube letters that glow over a grid horizon."),
    free("Mr Dafoe", "Headlines", "A fast brush script, the classic second line of a synthwave logo."),
    free("Orbitron", "Details", "Geometric sci-fi capitals for subtitles and credits."),
    paid("ITC Machine", "Headlines", "Hard, angular 1970 capitals: a natural base for chrome titles.", "ITC / Monotype"),
    paid("Eurostile", "Details", "Extended squared letters that read as 80s technology.", "Linotype"),
  ],
  "pop-art": [
    free("Bangers", "Headlines", "Comic-book display capitals with punchy energy."),
    free("Anton", "Headlines", "Heavy condensed type for bold, poster-style statements."),
    free("Comic Neue", "Body", "A cleaner comic hand for speech bubbles and captions."),
    paid("Roy Lichtenstein", "Body", "Based on the lettering in Lichtenstein's speech bubbles and captions.", "K-Type", "https://www.k-type.com/fonts/roy-lichtenstein/"),
    paid("Pop Art Comic", "Headlines", "P22's comic capitals, inspired by Lichtenstein, made for the Albright-Knox gallery.", "P22", "https://www.p22.com"),
  ],
  brutalism: [
    free("Archivo Black", "Headlines", "Heavy, blunt grotesque capitals as massive as concrete."),
    free("IBM Plex Sans", "Body", "An engineered, industrial sans with a no-nonsense tone."),
    free("Space Mono", "Details", "A raw monospace for labels and plan-like details."),
    paid("Univers", "Headlines", "The systematic modernist grotesque of 1960s–70s public signage.", "Linotype"),
    paid("DIN Next", "Body", "Based on German engineering lettering: functional and impersonal.", "Linotype"),
  ],
  "mid-century-modern": [
    free("Atomic Age", "Headlines", "Space-age display letters straight from 1950s optimism."),
    free("Jost", "Body", "Futura-style geometry, the workhorse of mid-century print."),
    free("Yellowtail", "Details", "A relaxed 50s-style script, in the spirit of Brush Script."),
    paid("Neutraface", "Headlines", "Based on the lettering of architect Richard Neutra's buildings.", "House Industries", "https://houseind.com"),
    paid("Brush Script", "Details", "The 1942 brush script that was everywhere in 1950s advertising.", "Monotype"),
  ],
  "clay-style": [
    free("Fredoka", "Headlines", "Round, soft letters that look pressed from plasticine."),
    free("Baloo 2", "Headlines", "Chunky, friendly shapes with a hand-made warmth."),
    free("Nunito", "Body", "A rounded sans that stays soft and readable at small sizes."),
    paid("Cooper Black", "Headlines", "The soft, fat serif of warm, playful titles.", "Monotype"),
    paid("Gotham Rounded", "Body", "A polished rounded geometric for clean text beside the models.", "Hoefler&Co.", "https://www.typography.com"),
  ],
  "surreal-design": [
    free("Instrument Serif", "Headlines", "A condensed, elegant serif with a quiet, uncanny calm."),
    free("Playfair Display", "Headlines", "High-contrast Didone letters for gallery-style titles."),
    free("Inter", "Body", "A neutral sans; surrealist posters often used plain grotesques."),
    paid("Didot", "Headlines", "The classic Didone of fashion and museum typography.", "Linotype"),
    paid("Canela", "Headlines", "A soft, sculptural serif with a dreamlike quality.", "Commercial Type", "https://commercialtype.com"),
  ],
  surveillance: [
    free("VT323", "Details", "Bitmap letters like a CCTV or VCR timestamp overlay."),
    free("Share Tech Mono", "Details", "A technical monospace for coordinates and tracking labels."),
    free("IBM Plex Mono", "Body", "A clear, institutional monospace for readouts and reports."),
    paid("OCR-B", "Details", "Frutiger's machine-readable face, used on documents and devices.", "Linotype"),
    paid("Berkeley Mono", "Details", "A precise modern monospace with a terminal feel.", "U.S. Graphics Company", "https://usgraphics.com"),
  ],
  acid: [
    free("Unbounded", "Headlines", "Wide, inflated letters ideal for chrome and liquid effects."),
    free("Syne", "Headlines", "Extra-bold, wide and a little odd: a rave-flyer attitude."),
    free("Zen Dots", "Details", "Rounded techno letters for dates and line-ups."),
    paid("Druk Wide", "Headlines", "An ultra-wide heavy sans, often warped into chrome acid titles.", "Commercial Type", "https://commercialtype.com"),
    paid("Neue Machina", "Headlines", "An inktrap geometric sans popular in the Acidgrafix revival.", "Pangram Pangram", "https://pangrampangram.com"),
  ],
  glitch: [
    free("Rubik Glitch", "Headlines", "Letters with built-in slices and digital breaks."),
    free("VT323", "Details", "Terminal bitmap type for corrupted-screen details."),
    free("Space Mono", "Body", "A mechanical monospace that feels machine-made."),
    paid("FF Blur", "Headlines", "Brody's soft-focus sans, blurred as if by a failing signal.", "Monotype (FontFont)"),
    paid("GT America Mono", "Details", "A crisp monospace for clean data amid the noise.", "Grilli Type", "https://www.grillitype.com"),
  ],
  gothic: [
    free("UnifrakturMaguntia", "Headlines", "A faithful Fraktur blackletter for titles."),
    free("Pirata One", "Headlines", "A condensed gothic display face that stays readable."),
    free("IM Fell DW Pica", "Body", "An old printing type with an aged, candlelit texture."),
    free("Cormorant Garamond", "Body", "A refined serif for longer text in a dark-romantic mood."),
    paid("Old English Text", "Headlines", "The familiar Textura blackletter of mastheads and old books.", "Monotype"),
    paid("Fette Fraktur", "Headlines", "Johann Christian Bauer's heavy 1850 Fraktur.", "Linotype"),
  ],
  "italo-disco": [
    free("Monoton", "Headlines", "Neon-tube letters for glowing club titles."),
    free("Audiowide", "Headlines", "Rounded techno letters that take chrome effects well."),
    free("Mr Dafoe", "Details", "A fast brush script for the script line on a sleeve."),
    paid("ITC Machine", "Headlines", "Angular capitals often rendered in airbrushed chrome.", "ITC / Monotype"),
    paid("Brush Script", "Details", "A classic brush script found on Italo disco sleeves.", "Monotype"),
  ],
  maximalism: [
    free("Anton", "Headlines", "Very tall, extra-condensed capitals for stacked poster titles."),
    free("Bebas Neue", "Headlines", "Condensed capitals that pack words into crowded layouts."),
    free("Permanent Marker", "Details", "A scrawled marker hand for notes on top of the collage."),
    free("Abril Fatface", "Details", "A heavy Didone for contrast among the noise."),
    paid("Druk", "Headlines", "Commercial Type's ultra-condensed, ultra-heavy sans for maximum impact.", "Commercial Type", "https://commercialtype.com"),
    paid("Knockout", "Headlines", "A large family of condensed sans widths for mixing loudly.", "Hoefler&Co.", "https://www.typography.com"),
  ],
  "web-1-0": [
    free("Tinos", "Body", "Matches Times New Roman's metrics: the default page text of the 90s web."),
    free("Arimo", "Body", "Matches Arial's metrics, for the other default look."),
    free("Comic Neue", "Headlines", "A cleaner take on Comic Sans, a personal-homepage favourite."),
    free("Pixelify Sans", "Details", "Pixel letters for buttons, counters and GIF-style details."),
    paid("Times New Roman", "Body", "The original default. Bundled with Windows and macOS; embedding it on the web needs a Monotype licence.", "Monotype"),
    paid("Verdana", "Body", "A 1996 'core font for the web'. Bundled with Windows and macOS; licensed separately for web use.", "Monotype"),
  ],
  "web-2-0-gloss": [
    free("Varela Round", "Headlines", "A soft, rounded sans in the spirit of VAG Rounded logos."),
    free("Nunito", "Body", "Rounded and friendly text for glossy interfaces."),
    free("Ubuntu", "Headlines", "A warm, slightly rounded sans with a 2000s tech feel."),
    free("Lobster", "Details", "A bold script used on countless late-2000s logos."),
    paid("VAG Rounded", "Headlines", "The soft rounded face behind many Web 2.0 startup logos.", "Linotype"),
    paid("Myriad", "Body", "Adobe's humanist sans, part of the era's UI and branding.", "Adobe Fonts", "https://fonts.adobe.com"),
  ],
  blueprint: [
    free("B612", "Body", "Designed for Airbus cockpits: engineered for clarity."),
    free("Share Tech Mono", "Details", "A technical monospace for dimensions and part numbers."),
    free("Architects Daughter", "Details", "Draftsman-style hand lettering for notes on the drawing."),
    paid("DIN Next", "Body", "Based on German engineering standards: the natural drawing-sheet sans.", "Linotype"),
    paid("Eurostile", "Headlines", "Squared, technical capitals for title blocks.", "Linotype"),
  ],
  bubbleglam: [
    free("Rubik Bubbles", "Headlines", "Inflated, balloon-like letters that take gloss and sparkle."),
    free("Chango", "Headlines", "Fat, rounded display letters with a puffy, playful weight."),
    free("Bagel Fat One", "Headlines", "Soft, chubby letters that look squeezable."),
    free("Fredoka", "Body", "Rounded text that matches the candy shapes."),
    paid("VAG Rounded", "Body", "A smooth rounded sans for clean supporting text.", "Linotype"),
    paid("FF Cocon", "Headlines", "A soft rounded face listed among the 'softies' of friendly design.", "Monotype (FontFont)"),
  ],
  chromecore: [
    free("Unbounded", "Headlines", "Wide, rounded letters with broad surfaces that reflect chrome well."),
    free("Syncopate", "Headlines", "Wide, minimal capitals for a sleek, reflective look."),
    free("Michroma", "Details", "Extended squared letters for technical labels."),
    paid("Druk Wide", "Headlines", "A heavy, extra-wide sans that gives chrome lots of surface.", "Commercial Type", "https://commercialtype.com"),
    paid("Eurostile", "Details", "Its Extended widths read as polished future-tech.", "Linotype"),
  ],
  grunge: [
    free("Special Elite", "Headlines", "Worn typewriter letters with ink breakup, the voice of photocopied gig flyers."),
    free("Rubik Distressed", "Headlines", "Heavy letters eaten away as if run through a tired photocopier."),
    free("Permanent Marker", "Details", "Fast marker handwriting for dates and scrawled notes."),
    paid("Template Gothic", "Headlines", "Barry Deck's 1990 stencil-like face, a signature of the grunge era.", "Emigre", "https://www.emigre.com"),
    paid("Trixie", "Body", "A dirty, uneven typewriter face that defined 90s distressed type.", "Monotype (FontFont)"),
  ],
  punk: [
    free("Rubik Dirt", "Headlines", "Bold, battered capitals for cut-out, ransom-note headlines."),
    free("Special Elite", "Body", "Typewriter text for fanzine copy and gig details."),
    free("Permanent Marker", "Details", "Hand-scrawled slogans written straight onto the paste-up."),
    paid("ITC American Typewriter", "Body", "The typewriter look of xeroxed fanzines, in a full family.", "ITC / Monotype"),
    paid("Trixie", "Headlines", "Grimy typewriter letters that suit photocopied, cut-and-paste layouts.", "Monotype (FontFont)"),
  ],
  deconstructivism: [
    free("Syne", "Headlines", "An uneven, experimental sans that breaks the tidy grid."),
    free("Anybody", "Headlines", "A variable width sans you can stretch and squeeze across layered grids."),
    free("Archivo Narrow", "Body", "A plain, narrow grotesque for small text set at angles."),
    paid("Template Gothic", "Headlines", "Emigre's 1990 face built from stencil templates, central to deconstructivist design.", "Emigre", "https://www.emigre.com"),
    paid("Matrix", "Body", "Zuzana Licko's early digital serif from the Emigre and Cranbrook years.", "Emigre", "https://www.emigre.com"),
  ],
  "new-wave": [
    free("Anton", "Headlines", "Compressed, heavy capitals for loud magazine mastheads."),
    free("Righteous", "Headlines", "Rounded geometric letters with an early-80s feel."),
    free("Chakra Petch", "Details", "Angular, techno-tinged letters for coverlines and issue numbers."),
    paid("Industria", "Headlines", "Neville Brody's 1984 condensed geometric face from The Face magazine.", "Linotype"),
    paid("Arcadia", "Headlines", "Brody's tall, thin display face, another staple of 80s new wave editorial.", "Linotype"),
  ],
  "post-modernism": [
    free("Abril Fatface", "Headlines", "A fat Didone to mix with other styles, postmodern eclecticism in one font."),
    free("Rubik Mono One", "Headlines", "Blocky, playful capitals for cut-out slogans."),
    free("Space Grotesk", "Body", "A quirky grotesque that keeps small text legible amid the collage."),
    paid("Citizen", "Headlines", "Zuzana Licko's 1986 bitmap-inspired face, part of Emigre's postmodern moment.", "Emigre", "https://www.emigre.com"),
    paid("ITC Avant Garde Gothic", "Headlines", "The tight geometric sans of 70s–80s design, often mixed ironically.", "ITC / Monotype"),
  ],
  cyberpop: [
    free("Rubik Mono One", "Headlines", "Heavy, blocky capitals that shout like a sticker sheet."),
    free("Dela Gothic One", "Headlines", "A heavy Japanese gothic for bold, anime-style titles."),
    free("DotGothic16", "Details", "Pixel Japanese type for game-UI details."),
    free("Zen Dots", "Details", "Rounded techno letters for badges and labels."),
    paid("Neue Machina", "Headlines", "An inktrap geometric with a hyper-digital edge.", "Pangram Pangram", "https://pangrampangram.com"),
    paid("Eurostile", "Details", "Squared tech letters for HUD-style interface text.", "Linotype"),
  ],
};
