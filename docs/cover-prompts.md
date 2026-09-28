# FORM / FIELD cover prompts

ChatGPT image prompts for the style covers, one per style. Colours come from each style's swatches in `src/content/styles/*.ts`. Save each result as `public/covers/<slug>.png` (or `<slug>1.png`, `<slug>2.png`… for several; image 2 becomes the main cover) and run `python scripts/covers.py`.

## Follow-ups for any style

- **It looks like a digital graphic, not an artwork:** Make it look like the real physical original: visible paper or canvas texture, real ink or paint behaviour, slight age and small imperfections. Keep the composition, colours and text.
- **The composition feels random:** Rework the composition so every element is deliberately placed: one clear focal point, a strong underlying structure (a diagonal, a grid or mirror symmetry) and fewer, larger forms. Keep the style and colours.
- **The lettering has a typo:** Correct the lettering so it reads exactly: "[paste the exact text from the prompt]". Change nothing else.
- **It added a wall, frame or mockup:** Show only the artwork itself, filling the image edge to edge, with no wall, frame, mockup or hands.
- **Colours drifted from the swatches:** Keep everything else identical, but shift the colours closer to these values: [paste the four hex codes from the card].

## 1. Swiss / International Typographic Style

- Slug: `swiss`
- Artwork: 1962 typographic concert poster (Screen print)
- Format: tall 2:3
- Cover: `public/covers/swiss.png`

```text
An original 1962 Swiss concert poster in the International Typographic Style, screen-printed on off-white uncoated paper. The typography is the image.

Composition: a strict modular grid. Two giant lowercase letters, "n" and "m", fill the upper two-thirds of the sheet: the "n" in ink black and the "m" in signal red, overlapping so the red overprints the black and turns darker where they cross. Both are cropped hard by the top and right edges of the sheet. Three thick black bars run at a steep diagonal behind them and are cut off by the edge. Below, the information sits in small, tightly set blocks on the grid columns, flush left, with generous empty paper between the blocks. Asymmetric, bold and rhythmic, with strong alignment and clear margins at the bottom and left.

Typography: a Helvetica-style neo-grotesque sans-serif, all lowercase, flush left and ragged right, with extreme contrast in scale between the giant letters and the small text. Set exactly this text: the giant letters "n" and "m"; "neue musik" in medium bold; "konzert der jungen komponisten" small; "grosser saal · 19.3.1962 · 20.15 uhr" small.

Colours: restrained. Paper white #F1EFEA, ink black #111111 and signal red #E2231A, with concrete grey #9A9A96 only for one thin rule.

Finish: flat, opaque screen-print ink with crisp edges, a darker overprint where the red crosses the black, a slight build-up of ink along the edges and faint paper grain.

Format: Tall portrait (2:3). Show it as a flat archival scan of the complete original poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: gradients, drop shadows, centred symmetry, ornament, photographs, copying any existing poster.
```

**If it misses:** Make the two giant letters larger and crop them harder by the top and right edges. Keep the small text blocks and the spelling exactly as they are.

## 2. Bauhaus

- Slug: `bauhaus`
- Artwork: 1926 exhibition poster (Colour lithograph)
- Format: tall 2:3
- Cover: `public/covers/bauhaus.png`

```text
An original 1926 exhibition poster from the Bauhaus workshops in Dessau: a colour lithograph in primary red, yellow, blue and black on unbleached cream paper.

Composition: built entirely from elementary forms on a strong diagonal axis running from lower left to upper right. A large red circle sits high on the right, partly cut off by the edge of the sheet. Heavy black bars cross the diagonal at right angles; a blue square and a yellow triangle lock into them; thin rules and small squares set up a rhythm. The shapes interlock like a constructed machine, with real tension and balance, and never combine into a house, face or other recognisable object.

Typography: a heavy geometric sans-serif, all lowercase, used as a building block: the words run along the black bars, one line set vertically. Set exactly this text: "form und farbe", "ausstellung", "dessau 1926".

Colours: unbleached cream #EDE6D6 ground, primary red #D62718, primary yellow #F2B90F, primary blue #1D3F8F, solid black.

Finish: flat lithographic ink with faint unevenness in the solid areas, a darker overprint where colours overlap, slight paper grain and gentle age toning.

Format: Tall portrait (2:3). Show it as a flat archival scan of the complete original poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: gradients, 3D shading, ornament, scattered clip-art shapes.
```

**If it misses:** Make the composition more constructed: a stronger diagonal axis, shapes that lock together, and the lettering running along the black bars. Keep the colours and print texture.

## 3. Gen X Soft Club

- Slug: `gen-x-soft-club`
- Artwork: 1998 fashion editorial (35mm colour film)
- Format: tall 2:3
- Cover: `public/covers/gen-x-softclub.png`

```text
A late-1990s fashion editorial photograph from an avant-garde style magazine, shot on 35mm colour film.

Composition: a model in a frosted, translucent pale-blue raincoat and small silver-tinted glasses stands turned three-quarters away from the camera in an empty space filled with icy haze. Beside her are a chrome bar stool and a translucent plastic partition. She stands slightly off-centre, with a lot of soft, airy space around her. The styling and framing feel deliberate and art-directed.

Colours: frosted blue-white #DDE7EF dominant, ice grey #A8BCCB, twilight blue #5E7FA3, brushed silver #C7CCD1.

Light: hazy, diffused light, as if through frosted glass or club haze.

Finish: soft focus, gentle bloom on the highlights, slight overexposure, a hint of motion blur and fine film grain; calm, cool and dreamlike, like the inside of an electronic-music CD booklet.

Format: Tall portrait (2:3). Show the photograph itself, full frame.

Text: no lettering, captions, logos or watermarks anywhere.

Avoid: hard contrast, saturated neon, gritty texture, crisp digital sharpness, stock-photo styling.
```

**If it misses:** Make it softer and more dreamlike: more haze, gentle bloom, slight overexposure and fine film grain. Keep the pose and colours.

## 4. Art Deco

- Slug: `art-deco`
- Artwork: 1928 hotel lobby panel (Lacquer, marble and gold leaf)
- Format: square 1:1
- Cover: `public/covers/art-deco.png`

```text
A straight-on photograph of an original 1928 Art Deco decorative wall panel from the lobby of a luxury hotel, made of black and deep-emerald lacquer, green veined marble, gold leaf and brass inlay.

Composition: strict mirror symmetry. A stepped ziggurat tower of green marble edged in gold rises up the centre into a large radiating gold sunburst at the top. On each side, a gold-and-marble fan motif sits above tall stepped pilasters decorated with chevron bands. A stepped marble plinth runs along the bottom. Every form is a bold geometric plane with crisp gold edges.

Colours: deep emerald black #14231F dominant, brushed gold #C9A45C, ivory #EFE6D2 for the palest highlights, jade green #3F6B5E in the marble.

Light: dramatic uplighting from below that catches the metallic edges and leaves soft reflections in the lacquer.

Finish: a real crafted object: polished lacquer, veined marble, gold leaf and brushed brass with slight age and hairline wear.

Format: Square (1:1). Show the panel itself, straight on, filling the image edge to edge, with no room, frame or people.

Text: no lettering, logos or watermarks anywhere.

Avoid: asymmetry, clutter, rustic textures, neon colours, gold that looks like yellow plastic.
```

**If it misses:** Make the gold look like real aged gold leaf and brushed brass with subtle wear. Keep the symmetry and everything else identical.

## 5. Vaporwave

- Slug: `vaporwave`
- Artwork: 2012 album cover (Digital collage)
- Format: square 1:1
- Cover: `public/covers/vapourwave.png`

```text
The original cover artwork for a 2012 vaporwave album: a digital collage made in early image-editing software, shown as artwork only, with no title or artist name.

Composition: a classical white marble bust, seen in three-quarter profile, stands on a pink-and-teal checkerboard floor that recedes to a soft violet dusk horizon, with a low pink sun glowing behind it. Two palm fronds, a translucent glass sphere and a blank early-1990s computer window with an empty grey title bar float around it. The arrangement is calm, strange and carefully balanced, like a still life.

Colours: vapor pink #FF9ECF, pool teal #7DE3E1, dusk violet #8A6CFF, lavender white #F4F1FF.

Finish: a mix of low-poly 3D render and photo cut-outs with hard pasted edges, visible JPEG artefacts, slight VHS softness and colour bleed; deliberately lo-fi, ironic and dreamy.

Format: Square (1:1). Show the flat artwork itself, edge to edge, not a vinyl or CD mockup.

Text: no lettering, Japanese characters, logos or watermarks anywhere.

Avoid: gritty realism, earthy colours, sunglasses on the statue, hyper-detailed texture.
```

**If it misses:** Make it more lo-fi: stronger JPEG artefacts, VHS colour bleed and softer edges. Remove any text or characters.

## 6. Collage Art

- Slug: `collage-art`
- Artwork: 1921 Dada collage (Cut paper on kraft card)
- Format: tall 2:3
- Cover: `public/covers/collage-art.png`

```text
An original 1921 Dada collage of cut and torn papers pasted on kraft card, photographed flat for a museum archive.

Composition: fragments layered at clashing scales and angles around one strong centre: strips of old tram tickets, newspaper scraps with bold printed numerals, a halftone photograph of a factory chimney, a cut-out bird in flight, a faded navy paper circle, a printer-yellow rectangle and a torn brick-red wedge. The pieces follow a deliberate, dynamic structure: a strong diagonal, a dense cluster at the centre and quieter paper toward the edges.

Colours: kraft paper #D8C3A0 dominant, faded navy #23364F, printer yellow #E5B83A, brick red #B8483A.

Light: soft raking light from the upper left that shows the paper layers.

Finish: real paper everywhere: torn fibrous edges, lifted corners, glue stains, slight yellowing, tiny shadows between layers and halftone dots visible up close.

Format: Tall portrait (2:3). Show it as a flat museum photograph of the whole collage, cropped to the edges of the card, with no wall, frame or hands.

Text: printed scraps may show partial words and numbers in old German typefaces, torn mid-word; no complete sentences, modern fonts, logos or signatures.

Avoid: seamless digital blending, clean vector shapes, glossy 3D.
```

**If it misses:** Make every piece a separate physical paper scrap with torn edges, lifted corners and a small cast shadow. Keep the arrangement.

## 7. Cyberminimalism

- Slug: `cyberminimalism`
- Artwork: Industrial-design object (Anodised aluminium on dark glass)
- Format: square 1:1
- Cover: `public/covers/cyberminimalism.png`

```text
A contemporary industrial-design object photographed for a gallery catalogue: a single slim, matte-black anodised-aluminium monolith with rounded edges, standing upright on a dark glass floor.

Composition: the monolith stands just off-centre in a large field of darkness. One thin ice-cyan light line runs vertically down its face. The dark glass floor is etched with a faint hairline grid that recedes into the dark, and the monolith's edges and light line reflect softly in it. Nothing else is in the frame.

Colours: carbon black #0C0D0F dominant, graphite #5B6168, cold white #E6E8EA for edge highlights only, ice cyan #7CF7FF for the one light line.

Light: low-key, with thin cold-white rim highlights tracing the edges and a soft falloff into black.

Finish: premium product photography: real micro-texture on the anodised metal, faint marks on the glass and sharp detail; sparse, precise and calm.

Format: Square (1:1). The whole object in frame.

Text: no lettering, numbers, logos or watermarks anywhere.

Avoid: clutter, warm or vintage tones, ornament, lens flares, sci-fi glow overload.
```

**If it misses:** Remove everything except the monolith and the grid, and add more empty darkness around it. Keep one thin cyan line.

## 8. Steampunk

- Slug: `steampunk`
- Artwork: Kinetic sculpture (Brass, copper, walnut)
- Format: square 1:1
- Cover: `public/covers/steampunk.png`

```text
A handcrafted kinetic sculpture photographed for an auction catalogue: a mechanical hummingbird in brass and copper.

Composition: the hummingbird perches with its wings half-raised on top of a small brass pressure gauge with a plain, unmarked dial, which sits on a round walnut plinth with a small drawer. The bird's body is an open cage of interlocking brass gears; its wings are fine brass lattice with riveted copper veins; its long beak points to the left. A thread of steam curls up from a valve on its back, and a stitched leather strap wraps the base of the gauge. Every part looks machined and assembled by hand, and all of it plausibly connects.

Colours: smoked walnut #2A1E17 background, polished brass #B5853A, oxidised copper #8A4B2A, parchment #D9C7A0 highlights.

Light: a warm, low, gaslight-coloured key light from one side, gentle haze and dark falloff behind, so the bird's silhouette reads clearly against the darkness.

Finish: rivets, screw heads, patina, fine tool marks and fingerprints on the metal; a real object photographed with a macro lens.

Format: Square (1:1). The whole sculpture in frame on a dark backdrop.

Text: no lettering, logos or watermarks anywhere.

Avoid: plastic, neon, magical glow, random piles of loose gears.
```

**If it misses:** Simplify the mechanism: fewer, larger parts that plausibly connect, and a clearer bird silhouette against the dark.

## 9. Y2K

- Slug: `y2k`
- Artwork: 2000 phone launch poster (Digital collage, chrome 3D and pixel graphics)
- Format: tall 2:3
- Cover: `public/covers/y2k.png`

```text
A Y2K-era graphic poster from 2000: a glossy digital collage that mixes early 3D chrome renders with flat pixel graphics, for a mobile-phone launch party.

Composition: a giant liquid-chrome hand bursts up from the bottom of the frame, holding a candy-bar mobile phone tilted toward the viewer. The phone is glossy iridescent chrome with a translucent aqua keypad, a stubby antenna and a small green monochrome screen. Behind it is a bright blue sky with puffy white clouds and rays of light. Around the phone float early-2000s computer windows with grey title bars, oversized white pixel cursor arrows, a pink speech-bubble notification, star and four-point sparkle stickers, a holographic starburst badge, small orbit rings and chrome droplets. The layout is dense and energetic but built around the phone as one clear hero, with the lettering at the top and bottom.

Typography: bold, beveled chrome techno lettering with an aqua glow for the title, and blocky pixel lettering on the phone screen and the badge. Set exactly this text: "SIGNAL 2000" in large chrome letters across the bottom; "NEW MESSAGE" in pixel lettering on the phone screen; "FREE SMS" in pixel lettering on the starburst badge.

Colours: ice white #E8F1F8 and sky blue for the background, translucent aqua #3FA7D6, chrome silver #C6CBD4, iridescent pink #F49AC2, with a hot-pink accent on the speech bubble and stickers.

Light: bright studio light with sharp specular highlights on the chrome, rainbow iridescence along the edges of the phone, and a lens flare where the sun breaks through the clouds.

Finish: turn-of-the-millennium CGI: glossy chrome and translucent plastic with visible reflections, combined with flat pixel graphics, fine dither patterns, light scanlines, a faint halftone and slight print grain, like a real 2000 club flyer or magazine poster.

Format: Tall portrait (2:3). Show the flat poster artwork itself, edge to edge, with no wall, frame, mockup or hands holding the poster.

Text: spell the lettering exactly as written; add no other words, no small paragraphs, and no real brand names or logos.

Avoid: real phone brands or copies of real products, muted earth tones, flat matte surfaces, modern minimal design.
```

**If it misses:** Keep the phone as the one clear hero: make it larger and shinier, push the stickers and windows to the edges, and keep the lettering exactly as it is.

## 10. Psychedelic

- Slug: `psychedelic`
- Artwork: 1967 concert poster (Offset lithograph)
- Format: tall 2:3
- Cover: `public/covers/psychedelic.png`

```text
An original 1967 psychedelic concert poster from the San Francisco ballroom scene: an offset lithograph.

Composition: a stylised flower-sun blooms at the centre; its petals melt and swell outward into swirling, radiating concentric bands that fill the whole sheet, crossed by rippling optical line patterns. There is no empty space: every gap is filled with pattern or lettering.

Typography: hand-drawn lettering that melts, swells and bends to fill the shapes around the central image, stretched until it is almost hard to read. Set exactly this text: "ELECTRIC ORCHARD" arching across the top, and "LANTERN BALLROOM · MARCH 3 & 4" curving along the bottom.

Colours: tangerine #FF6B1A set directly against purple haze #7B2FBF so the edges vibrate, electric green #2FBF71, marigold #FFD23F.

Finish: flat offset ink with slight misregistration, visible paper texture and a hand-drawn line quality.

Format: Tall portrait (2:3). Show it as a flat archival scan of the complete original poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: muted neutrals, empty space, rigid grids, 3D shading, smooth gradients.
```

**If it misses:** Make the lettering melt and stretch to fill the shapes, and correct it to read exactly "ELECTRIC ORCHARD" and "LANTERN BALLROOM · MARCH 3 & 4". Change nothing else.

## 11. Memphis

- Slug: `memphis`
- Artwork: 1982 cabinet (Plastic laminate, lacquered wood)
- Format: tall 2:3
- Cover: `public/covers/memphis.png`

```text
A 1982 postmodern cabinet by a Milan design collective, photographed for a design-museum catalogue.

Composition: a low cabinet raised on four chunky legs of different shapes: a flamingo-pink cylinder, an aqua cone standing on its tip, an egg-yellow cube and a black-and-white striped column. Its body is covered in white plastic laminate printed with a black squiggle-and-confetti pattern. On top, an aqua arch, a flamingo-pink half-disc and a small yellow ball are stacked off-balance but perfectly stable. It stands on a speckled terrazzo floor.

Colours: laminate white #F7F0E1, flamingo pink #FF5D8F, aqua #2EC4B6, egg yellow #FFCB2E, with black pattern details.

Light: bright, even studio light with a soft, short shadow on a seamless pale backdrop.

Finish: real plastic laminate and lacquered wood with crisp edges, visible seams and slight real-world imperfections: a genuine designed object, bold and clashing.

Format: Tall portrait (2:3). The whole cabinet in frame.

Text: no lettering, logos or watermarks anywhere.

Avoid: muted earth tones, heavy wear, empty minimalism, shiny CGI plastic.
```

**If it misses:** Make it a real photographed piece of furniture: laminate seams, lacquered wood and a soft studio shadow. Keep the shapes and colours.

## 12. Art Nouveau

- Slug: `art-nouveau`
- Artwork: 1898 decorative poster (Stone lithograph)
- Format: tall 2:3
- Cover: `public/covers/art-nouveau.png`

```text
An original 1898 Parisian decorative poster: a colour lithograph in the Art Nouveau style.

Composition: a serene young woman in profile fills the centre, her long hair sweeping outward in whiplash curves that become part of the ornament. Behind her head a large circular halo is patterned with stylised irises and poppies. The figure sits inside a tall arched frame of stems, leaves and flowers, with decorative panels for the lettering at the top and bottom. Every curve flows into the next.

Typography: hand-drawn Art Nouveau lettering with organic, flowing letterforms, woven into the top and bottom panels. Set exactly this text: "SALON DES IRIS" at the top and "PARIS 1898" at the bottom.

Colours: vellum #EDE1C4, ochre #B9853F, sage green #5E7153, madder brown #7A3B2E, with fine dark contour lines.

Finish: flat stone-lithograph colour inside fine, even contour lines, gentle paper texture, slight age toning and a soft fold line.

Format: Tall portrait (2:3). Show it as a flat archival scan of the complete original poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: photorealistic skin, 3D rendering, neon colours, hard geometric grids.
```

**If it misses:** Render the face and hair with flat lithographic colour and fine contour lines, not painted shading. Keep the lettering exactly as it is.

## 13. Cyberpunk

- Slug: `cyberpunk`
- Artwork: Film concept painting (Digital painting)
- Format: square 1:1
- Cover: not yet

```text
A cinematic cyberpunk city street at night, painted as high-end digital concept art for a science-fiction film.

Composition: a street-level view straight down a long, wet avenue with a strong one-point perspective. Towering buildings crowd both sides, with overhanging floors, balconies and pipes stacked high, rising into a cyan haze that fades into a glowing vanishing point in the distance. Tangled power cables sag across the top of the frame. Both sides are covered in dense vertical and horizontal neon signs, shop fronts and screens, glowing as illegible glyph-like shapes rather than readable words. Silhouetted pedestrians walk along the street in small groups, with one figure in a long coat at the centre walking away from the viewer. On the right, a dark car with bright headlights waits by the kerb; a second car sits further back in the haze.

Colours: a deep blue-black night (#07090F) with a strong neon-cyan haze (#00F0FF) in the distance, neon magenta (#FF1F8E) and sodium amber (#FFB000) signs, and small touches of red and green.

Light: the neon signs, screens and headlights are the only light sources. The wet asphalt mirrors every sign in long coloured streaks of magenta, cyan and amber, and soft volumetric haze and light rain fill the air.

Finish: a rich, glossy digital painting with sharp detail in the foreground, softer atmospheric detail in the distance, strong colour contrast and cinematic depth.

Format: Square (1:1). Show the image itself, full frame.

Text: no readable words, letters, logos or watermarks anywhere; the signs show only abstract glyph shapes and light.

Avoid: daylight, empty streets, pastel colours, flat lighting, a clean or tidy city.
```

**If it misses:** Make the reflections on the wet street brighter and longer, and deepen the cyan haze toward the vanishing point. Turn any readable sign into abstract glyphs.

## 14. Synthwave

- Slug: `synthwave`
- Artwork: 1985 record sleeve painting (Airbrushed acrylic on board)
- Format: square 1:1
- Cover: `public/covers/synthwave.png`

```text
The original airbrush painting for a 1985 synth-pop record sleeve, shown as artwork only, with no title or band name.

Composition: a glowing hot-magenta perspective grid runs to the horizon under a huge striped setting sun, orange at the bottom to magenta at the top, cut by horizontal gaps. Dark violet mountain silhouettes rimmed with cyan sit on the horizon, two palm silhouettes frame the sides, and a starry midnight-violet sky fills the top. Simple, iconic and uncrowded.

Colours: midnight violet #140B2E, hot magenta #FF2E97, laser cyan #21E6FF for thin rim highlights, sunset orange #FF9F1C.

Light: neon glow and a luminous horizon sun.

Finish: hand-airbrushed acrylic on illustration board: smooth sprayed gradients, crisp masked edges on the grid lines, tiny stars flicked in white paint, soft glow and faint board texture.

Format: Square (1:1). Show the flat painting itself, edge to edge, not a vinyl mockup.

Text: no lettering, logos or signatures anywhere.

Avoid: cars, chrome lettering, daylight, clutter, modern 3D rendering.
```

**If it misses:** Make it look hand-airbrushed: smoother sprayed gradients, flicked-paint stars and faint board texture. Remove any extra objects.

## 15. Pop Art

- Slug: `pop-art`
- Artwork: 1964 painting (Silkscreen and acrylic on canvas)
- Format: square 1:1
- Cover: `public/covers/pop-art.png`

```text
An original 1964 Pop Art painting in silkscreen and acrylic on canvas.

Composition: a red rotary telephone enlarged to monumental scale fills the canvas, seen from slightly above, with the receiver lifted and tilted and the coiled cord looping toward one corner. Beside it, a jagged comic-book burst holds a single word.

Typography: bold comic-book capitals inside the burst. Set exactly this text: "RING!"

Colours: comic yellow #FFE14F background, tomato red #E8232A for the phone, process blue #1F5FBF, outline black #111111.

Finish: thick black comic-book outlines, flat saturated primaries, large visible Ben-Day dots in the shading and background, slight misregistration between the colour layers, and paint sitting on visible canvas weave.

Format: Square (1:1). Show it as a flat museum photograph of the whole canvas, cropped exactly to its edges, with no wall, frame or gallery.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: muted colour, realistic shading, soft gradients, copying any famous existing artwork.
```

**If it misses:** Make the Ben-Day dots larger and clearly visible, and keep "RING!" as the only text. Change nothing else.

## 16. Brutalism

- Slug: `brutalism`
- Artwork: 1971 architectural photograph (Gelatin silver print)
- Format: tall 2:3
- Cover: `public/covers/brutalism.png`

```text
A 1971 architectural photograph of a Brutalist housing estate, shot on a large-format camera and printed as a warm-toned black-and-white gelatin silver print.

Composition: a low-angle view up at a monumental block with heavy repeated modular balconies, deep recessed openings in shadow, a massive cantilevered upper storey and a sculptural concrete stair tower. The board-marked concrete shows the grain of the timber formwork and streaks of weathering. A single small figure crosses the walkway at the base for scale. The verticals are straight and the composition is strong and deliberate.

Colours: warm greys only: weathered concrete #A7A39A, shadowed concrete #5D5A55, overcast sky #D9D6CF, deep recess #2E2D2B.

Light: overcast sky with a hint of raking side light that brings out the board-marked texture.

Finish: large-format sharpness, rich mid-tones, fine grain and deep but not crushed blacks: the quiet authority of a documentary architecture print.

Format: Tall portrait (2:3). Show the photograph itself, full frame, not a print on a wall.

Text: no lettering, logos or watermarks anywhere.

Avoid: HDR, colour, sunset skies, glossy surfaces.
```

**If it misses:** Make it a real darkroom print: no HDR, natural overcast light, fine grain and warm grey tones. Keep the building and framing.

## 17. Mid-Century Modern

- Slug: `mid-century-modern`
- Artwork: 1957 exhibition poster (Screen print)
- Format: tall 2:3
- Cover: `public/covers/mid-century-modern.png`

```text
An original 1957 screen-printed poster for a modern furniture exhibition.

Composition: a sunlit modern living room simplified into flat, overlapping shapes: a low teak sideboard on tapered legs, a moulded-plywood lounge chair, a brass starburst clock, a potted rubber plant and a large window. The shapes overlap as transparent layers of colour with boomerang and starburst motifs, and some colour blocks sit slightly off their outlines, the way hand-cut screens do.

Typography: a friendly mid-century sans-serif and a casual brush script. Set exactly this text: "modern living" large, "furniture & design exhibition" small, "1957" small.

Colours: warm paper #F2E8D5, mustard #D99B2B, teal #1F6F6B, teak brown #9A5230, with a touch of burnt orange.

Finish: flat screen-printed colour with visible grain, slightly offset registration, hand-cut shapes and a dry, crayon-like texture in places: the warmth of a real 1950s print.

Format: Tall portrait (2:3). Show it as a flat archival scan of the complete original poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: chrome, neon, clutter, perfect modern vector shapes.
```

**If it misses:** Make it look screen-printed by hand: flatter colour, visible grain and slightly offset registration. Keep the lettering exactly as it is.

## 18. Clay Style

- Slug: `clay-style`
- Artwork: Stop-motion film set (Plasticine miniature)
- Format: tall 2:3
- Cover: `public/covers/clay-art.png`

```text
A photograph of a hand-made stop-motion miniature set built for an animated short film.

Composition: a chunky plasticine hot-air balloon in coral and butter stripes, with a small basket of woven clay, floats on a visible support wire above rolling hills of powder-blue and peach clay dotted with tiny rounded clay houses and lollipop trees. Cotton-wool clouds hang on threads.

Colours: peach clay #FBE7D4, coral clay #F28C8C, powder blue clay #8AC6D0, butter clay #F6D55C.

Light: warm, soft miniature-set lighting with gentle shadows.

Finish: everything clearly handmade, with fingerprints, tool marks, slightly lumpy forms and matte clay with no gloss; a macro lens with shallow depth of field, the edges of the set softly out of focus.

Format: Tall portrait (2:3). The balloon and hills fully in frame.

Text: no lettering, logos or watermarks anywhere.

Avoid: glossy CGI, faces on objects, a plastic-toy look.
```

**If it misses:** Make all the clay matte, with visible fingerprints and lumpy, hand-shaped forms, and keep the support wire visible.

## 19. Surreal Design

- Slug: `surreal-design`
- Artwork: 1950s Surrealist painting (Oil on canvas)
- Format: tall 2:3
- Cover: `public/covers/surreal-design.png`

```text
An original 1950s Surrealist oil painting on canvas.

Composition: a single freestanding red wooden door, slightly ajar, stands alone on an endless plain of smooth desert sand under a clear pale-blue sky. Through the gap, a sliver of a different, deeper blue sky is visible. The door casts a long late-afternoon shadow across the sand. Nothing else is in the scene.

Colours: desert sand #E9D8C4 dominant, dream sky #8FB3D9, red door #B34A3C as the one accent, long shadow #3E3A4F.

Light: clear, low late-afternoon sun with long, crisp shadows.

Finish: smooth, patient oil technique with softly blended skies and crisp edges on the door, fine craquelure and visible canvas weave up close: calm, poetic realism painted by hand, not a photograph or render.

Format: Tall portrait (2:3). Show it as a flat museum photograph of the whole canvas, cropped exactly to its edges, with no wall, frame or gallery.

Text: no lettering, signatures, logos or watermarks anywhere.

Avoid: clutter, horror, magical glow, photographic sharpness.
```

**If it misses:** Make it look hand-painted in oil: visible canvas weave, a softly blended sky and faint craquelure. Remove any extra objects.

## 20. Glassmorphism

- Slug: `glassmorphism`
- Artwork: Light installation (Frosted acrylic and coloured light)
- Format: tall 2:3
- Cover: not yet

```text
A contemporary light installation in a darkened gallery, photographed for the artist's catalogue.

Composition: three large frosted-acrylic panels with rounded corners hang on fine steel wires at slightly different angles and depths, overlapping each other. Behind them, two large soft discs of violet and rose light glow on a deep indigo wall, blurred through the frosted panels. Thin bright highlights catch the polished edges of the acrylic.

Colours: deep indigo #1B1F3B background, violet #8F5CFF, rose #FF6AA2, frost white #E9ECFF for the glass tint and edges.

Light: coloured light glowing through the translucent layers; the rest of the room is dark.

Finish: real materials and real light: the grain of the frosted surface, subtle refraction at the edges, faint reflections on the dark floor and fine photographic grain. Quiet, elegant and minimal.

Format: Tall portrait (2:3). The whole installation in frame.

Text: no lettering, icons, logos or watermarks anywhere.

Avoid: opaque panels, hard outlines, interface elements, earthy textures.
```

**If it misses:** Make it a real photograph of the installation: frosted acrylic grain, faint floor reflections and fine photographic grain. Keep the panels empty.

## 21. Web 1.0

- Slug: `web-1-0`
- Artwork: 1998 personal homepage (Screen capture, early browser)
- Format: tall 2:3
- Cover: `public/covers/web-1-0.png`

```text
A full-page screen capture of a 1998 personal homepage, shown inside a grey early-browser window with a navy title bar, captured as one tall scrolling page.

Composition: a tiled background of small twinkling stars on dark navy. Everything is stacked in the centre: a big rainbow word-art title at the top, a spinning globe GIF, a yellow-and-black "under construction" sign with a little digging-worker icon, a rainbow divider bar, a column of bevelled grey buttons, a hit counter with black-and-green digits, a mailbox icon and a small row of 88x31 web badges with simple pixel pictures and no readable words. Some things are slightly misaligned, the way hand-coded HTML pages were.

Typography: a default serif for body links, blue and underlined, and word-art style lettering for the title. Set exactly this text: "WELCOME TO MY HOMEPAGE" as the title; "UNDER CONSTRUCTION" on the sign; "Sign my guestbook" and "My links" as blue underlined links; "You are visitor 004217" beside the counter.

Colours: system grey #C0C0C0 for the browser and buttons, hyperlink blue #0000EE, navy title bar #000080, highlight yellow #FFFF00, plus raw web-safe brights in the GIFs.

Finish: aliased pixel edges, dithered GIF graphics, 256-colour banding and hard bevels; a real 800x600 screen from 1998, not a modern redesign.

Format: Tall portrait (2:3). Show the screen capture itself, edge to edge, not a photo of a monitor.

Text: spell the lettering exactly as written; add no other words, no real website names, logos or browser brand names.

Avoid: smooth gradients, modern flat UI, high-resolution 3D, subtle minimalism.
```

**If it misses:** Make it look more like real 1998 HTML: more aliased pixel edges, dithered GIFs and slightly misaligned elements. Keep the lettering exactly as it is.

## 22. Cyberpop

- Slug: `cyberpop`
- Artwork: Holographic art print (Digital illustration on holo-foil paper)
- Format: tall 2:3
- Cover: `public/covers/cyperpop.png`

```text
A limited-edition art print of an original cyberpop illustration, printed on holographic foil paper.

Composition: an original anime-influenced character with short cyan hair, oversized headphones and a translucent pink jacket leans toward the viewer, winking, at the centre. Around her, overlapping floating interface windows, pixel cursor arrows, heart and star stickers, loading bars, a chat bubble, glossy bubbles and pixel sparkles burst outward like a sticker-bomb. One window at the top reads as a status box. The layout is busy and energetic but the character stays the clear focal point.

Typography: blocky pixel lettering inside the status window. Set exactly this text: "ONLINE".

Colours: screen white #F6F0FF background, cyber pink #FF3CAC, hologram cyan #2BD2FF, lime flash #C6FF3D, with thin black linework.

Light: bright, high-key light with a neon edge glow around the character and stickers.

Finish: crisp clean digital linework and cel shading, glossy sticker highlights, and a rainbow holographic foil shimmer across parts of the print.

Format: Tall portrait (2:3). Show the flat print itself, edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: dystopian grime, muted earth tones, heavy darkness, any existing anime character.
```

**If it misses:** Make the character the clear focal point: larger and more centred, with the windows and stickers pushed toward the edges. Keep the lettering exactly as it is.

## 23. Bubbleglam

- Slug: `bubbleglam`
- Artwork: Pop fragrance campaign still life (Studio photograph)
- Format: tall 2:3
- Cover: `public/covers/bubbleglam.png`

```text
A studio still-life photograph for a pop-star fragrance campaign in the early 2000s.

Composition: a cluster of glossy inflated shapes floats and piles up in a soft pink studio: a big puffy word in shiny inflatable balloon letters across the upper half, a rhinestone-studded heart-shaped perfume bottle in the centre, inflated vinyl hearts and stars, pearly balloons, a lilac satin ribbon and a scatter of glitter and loose rhinestones on the floor.

Typography: puffy, inflated foil-balloon letters with bright reflections. Set exactly this text: "bubble".

Colours: cotton candy #FFE3F1 background, hot bubblegum #FF4FA3, lilac #B98CFF, champagne #FFF4B8 for the gold and pearl highlights.

Light: soft pink studio light with bright specular highlights on every inflated surface and sparkle on the rhinestones.

Finish: a real photograph of real objects: high-gloss inflated vinyl with visible seams, faceted rhinestones, fine glitter and a soft pink shadow; glamorous and playful.

Format: Tall portrait (2:3). Show the photograph itself, full frame.

Text: spell the lettering exactly as written; add no other words, brand names, logos or watermarks.

Avoid: matte earth tones, sharp angular forms, grunge, CGI-looking plastic.
```

**If it misses:** Make it look like a real studio photograph: visible balloon seams, real rhinestone facets and a soft floor shadow. Keep the lettering exactly as it is.

## 24. Chromecore

- Slug: `chromecore`
- Artwork: 1980s sci-fi art book illustration (Airbrush and gouache on board)
- Format: tall 2:3
- Cover: `public/covers/chromecore.png`

```text
An original illustration from a 1980s Japanese science-fiction art book, painted in airbrush and gouache on illustration board.

Composition: a sleek liquid-chrome serpent-dragon lunges diagonally from the upper left toward the lower right, its head filling most of the frame and cut off hard by the top and left edges. Its jaw is wide open, showing rows of sharp chrome fangs, and its body melts behind it into flowing ribbons of molten metal. Loose chrome droplets and small beads of liquid metal float in the air around it. The surfaces are smooth and organic, part creature and part machine, with deep hollows and bulging curves that catch the light. Dramatic, dynamic and iconic, like the cover plate of the book.

Colours: void black #0E0E10 in the deepest shadows, a deep ultramarine-blue background that fades lighter toward one corner, mirror highlight #E9ECEF, chrome mid #8B929A, reflected sky blue #5AB3FF across the upper surfaces, and one small warm orange-red reflection inside the mouth.

Light: hard studio light reflected as crisp white streaks and star-glints along every curve, with the blue background mirrored in the chrome.

Finish: hand-airbrushed chrome: smooth sprayed gradients, crisp masked edges on the reflections, white highlights and four-point glints added with a fine brush, and faint board texture. The flat, graphic reflections of 1980s airbrush chrome, not a modern 3D render.

Format: Tall portrait (2:3). Show the flat artwork itself, edge to edge, with no wall, frame, mockup or book.

Text: no lettering, logos or signatures anywhere.

Avoid: gore, blood, matte surfaces, earthy colours, photoreal CGI, clutter.
```

**If it misses:** Make it look hand-airbrushed: flatter, more graphic chrome reflections, crisp white glints and faint board texture. Crop the head harder at the top and left edges.

## 25. Web 2.0 Gloss

- Slug: `web-2-0-gloss`
- Artwork: Mid-2000s desktop wallpaper (Glossy digital collage)
- Format: tall 2:3
- Cover: `public/covers/web-2-0.png`

```text
An original mid-2000s desktop wallpaper in the glossy Web 2.0 style, a bright, optimistic digital collage of nature and technology, shown full screen as one tall image.

Composition: a vivid blue sky with soft white clouds and a sun glow at the top; below it, lush, rounded green hills with shiny grass rolling toward the bottom, where crystal-clear aqua water fills the lower third with a big glossy splash, rising bubbles and two small orange fish. Floating above the hills, a cascade of glossy interface windows with rounded corners, sky-blue gradient title bars and glassy reflections tilts toward the viewer at different depths, alongside a scatter of glossy rounded app icons (a globe, a speech bubble, a music note, a camera, a folder) and several large transparent glass bubbles, one with a tiny green leaf and a fish inside. On the right side, a translucent lime-green gadget like a chunky pager, set in a curvy chrome frame with a small glowing screen, floats at an angle, with glossy hot-pink liquid gel dripping from its top and over its sides. A narrow column of small desktop icons runs down the left edge. Everything layers smoothly into one clear, airy scene, with the windows and the gadget as the focal points.

Typography: a rounded, friendly sans-serif with a glossy gradient. Set exactly this text: "hello!" on the gadget's screen.

Colours: gel blue #3BA0FF sky and window bars, lime gel #7ED321 hills and gadget, page white #FFFFFF clouds, highlights and glass, tangerine gel #FF7F2A in the fish and one icon, aqua water and a hot-pink accent in the dripping gel.

Light: bright, clean daylight with a top-down highlight band on every glossy surface, sparkling specular glints on the bubbles and chrome, soft reflections and gentle drop shadows under the floating windows.

Finish: the polished look of mid-2000s desktop graphics: candy gradients, glassy highlight bands, crisp rounded corners, transparent glass with refraction, glossy water and slightly soft anti-aliasing. Everything feels tactile, clickable and a little dated.

Format: Tall portrait (2:3). Show the wallpaper image itself, edge to edge, not a photo of a monitor.

Text: spell the lettering exactly as written; add no other words, window titles, operating-system logos, real brand names or watermarks.

Avoid: flat modern design, dark moody scenes, grunge textures, real software logos, clutter that buries the focal points.
```

**If it misses:** Make it cleaner and glossier: fewer, larger floating windows and icons, stronger highlight bands and clearer glass bubbles, with the lime gadget clearly visible. Keep the lettering exactly as it is.

## 26. Maximalism

- Slug: `maximalism`
- Artwork: Maximalist graphic-design poster (Risograph, screen print and marker)
- Format: tall 2:3
- Cover: `public/covers/maximalism1.png`

```text
An original maximalist graphic-design poster, printed in risograph and screen print, with hand-drawn marker added on top.

Composition: a large black-and-white halftone portrait of a young man in a light shirt fills most of the sheet. It is cut into strips and reassembled slightly out of line, with one eye and part of the face swapped for fragments from other photographs at different scales. Over it run loose hand-drawn marker scribbles: electric-blue lines tracing the hair and tie, lime-green zigzags over the shirt and collar, and a yellow outline around one eye. Behind the portrait, torn colour blocks in pink, sky blue and yellow peek out, and a few flat geometric shapes overlap the edges. A giant condensed title runs the full width of the top and overlaps the head. The poster is layered, loud and full, but the face stays the clear centre.

Typography: very tall, extra-condensed bold sans-serif capitals in poster red for the title, a small bold condensed subline in red, and one scrawled handwritten marker word. Set exactly this text: "MAXIMALISM" as the giant title across the top; "MORE IS MORE" as the red subline below it; "yes" as a blue marker scrawl near the collar.

Colours: cream paper, black halftone, poster red, electric cobalt blue, lime green and sunshine yellow, with small touches of pink and sky blue.

Finish: coarse halftone dots in the photo, slight misregistration between the ink layers, riso grain, real marker strokes with uneven pressure and ink bleed, and visible paper texture.

Format: tall portrait (2:3). Show it as a flat archival scan of the complete poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, no paragraphs of small text, and no names, logos or signatures.

Avoid: empty space, neat grids, muted colours, copying any existing poster, the likeness of a real person.
```

## 27. Gothic

- Slug: `gothic`
- Artwork: 1887 gothic novel binding (Tooled oxblood leather and gold leaf)
- Format: tall 2:3
- Cover: `public/covers/gothic2.png`

```text
An original 1887 gothic novel, bound in oxblood leather with tooled gold decoration, photographed straight on for an antiquarian book catalogue.

Composition: the front cover fills the frame. At its centre, a tall pointed Gothic arch in gilt tracery frames a black raven perched on a skull-free stone ledge beneath a crescent moon, with a single lit candle below. Around the arch, an intricate border of thorned roses, ivy, bats' wings and interlaced Gothic tracery is tooled into the leather in gold and blind-embossed black. Heavy black iron corner pieces with pointed trefoil shapes guard each corner. Symmetrical, dense and ornate, with every inch decorated.

Typography: ornate blackletter capitals and lowercase in gold leaf, with decorative flourishes on the first letter. Set exactly this text: "Nocturne" as the title above the arch, and "1887" small below it.

Colours: raven black #0F0D0E, oxblood #5A1520 leather, aged gold #A88A4E for the gilding, cathedral stone #6B6966 for the worn highlights.

Light: low, warm candle-like light from one side that rakes across the cover, catching the raised gold and embossing and leaving the edges in deep shadow.

Finish: a real old book: cracked and scuffed leather grain, gold leaf worn away on the raised edges, slightly rounded corners, a faint dust sheen and tiny scratches on the iron. Moody, mysterious and richly detailed.

Format: tall portrait (2:3). Show the front cover itself, straight on, filling the image edge to edge, with no table, hands or other books.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: bright pastels, flat vector shapes, cheerful daylight, gore, cartoon styling, modern fonts.
```

**If it misses:** Correct the gold lettering so it reads exactly "Nocturne" and "1887", in clear blackletter. Change nothing else.

## 28. Surveillance

- Slug: `surveillance`
- Artwork: Graphic-design poster (Drone photograph with survey-drawing overlays)
- Format: tall 2:3
- Cover: `public/covers/surveillance.png`

```text
An original contemporary graphic-design poster about surveillance, combining an overhead drone photograph with the look of a technical survey drawing. Printed as a large digital print.

Composition: the base image is a high-angle drone photograph looking down at a grey asphalt street crossed by faded yellow road markings. A single person in a hooded jacket and shorts walks away from the camera near the centre, casting a long shadow, face never visible. Thin bright-green tracking boxes lock onto the figure, with corner brackets and a small label tab. Three square close-up crops of the same figure (the hood from above, the torso, the legs mid-stride) sit in green-outlined frames at the top left, left edge and lower left, joined to the main box by thin leader lines. Over the whole photo lies a faint survey grid with a horizontal measuring scale along the bottom, elevation numbers up the left edge and a dashed trajectory line tracing the walker's path. Pale halftone fragments of an office building and a few small black human silhouettes are collaged into the grid at the edges. Small flat interface icons float in the frame: a warning triangle, a folder, a speech bubble and a red recording dot. Layered and precise, with the walking figure as the clear focal point.

Typography: a small, blocky monospace for all labels and numbers, in green and white. Set exactly this text: "SUBJECT 07" on the tracking box label; "14:07:22" in the top left corner; "REC" beside the red dot at the top right; "0+00", "1+00", "2+00", "3+00" along the bottom scale; "1180", "1190", "1200" up the left edge.

Colours: washed grey #C7CCC6 asphalt and paper, monitor dark #1C221E for the silhouettes and shadows, a bright tracking green for the boxes and labels (with night-vision green #7F9A84 for the fainter grid), record red #E94B3C for the dot only, and a small touch of warning yellow on the triangle.

Light: flat, overcast daylight in the drone photo with a soft, long shadow from the walker.

Finish: a crisp photograph with slight compression and sensor noise, fine hairline technical linework, grainy halftone in the collaged building fragments, and flat, clean interface graphics: clinical, detached and observational.

Format: tall portrait (2:3). Show the flat poster artwork itself, edge to edge, with no wall, frame, mockup or hands.

Text: spell the labels and numbers exactly as written; add no other words, names, logos or signatures.

Avoid: a visible face, the likeness of a real person, cinematic shallow depth of field, vivid saturated colour across the whole image, clutter that hides the walker.
```

**If it misses:** Keep the walking figure as the clear focal point: thin out the grid and icons, push the close-up crops to the edges, and keep all labels exactly as they are.

## 29. Acid

- Slug: `acid`
- Artwork: 1992 rave flyer (Offset print, chrome 3D type)
- Format: tall 2:3
- Cover: `public/covers/acid.png`

```text
An original 1992 acid-house rave flyer, printed on glossy card.

Composition: strictly mirrored and symmetrical around a vertical centre line. A glowing acid-green wireframe grid bends into a tunnel that recedes to a bright point in the middle. In front of it, the title lettering melts and stretches like liquid chrome, dripping at the edges. Ultraviolet rings pulse outward from the centre, and small strobe flashes spark around the lettering.

Typography: warped, liquefied chrome 3D lettering for the title, and a narrow techno sans-serif for the small line. Set exactly this text: "HYPERSPACE" large across the centre; "ALL NIGHT · 22.02.92" small at the bottom.

Colours: rave black #0A0A0A background, acid green #B6FF1A, liquid chrome #D9D9D9, ultraviolet #7A5CFF.

Light: blacklight glow and hard strobe highlights on the chrome.

Finish: early-1990s computer graphics printed on glossy card: slightly banded gradients, a visible print dot pattern and a faint gloss sheen, like a real flyer handed out at the door.

Format: Tall portrait (2:3). Show it as a flat scan of the complete flyer, filling the image edge to edge, with no wall, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or smiley faces.

Avoid: soft pastels, paper textures, calm minimal space, modern 3D rendering.
```

**If it misses:** Make the chrome lettering melt and stretch more, and keep the whole design mirrored around the centre. Keep the spelling exactly as it is.

## 30. Glitch

- Slug: `glitch`
- Artwork: Glitch-art poster (Corrupted digital marbling, gallery print)
- Format: tall 2:3
- Cover: `public/covers/glitch2.png`

```text
An original contemporary glitch-art poster: a digitally marbled image whose file has been deliberately corrupted, printed as a large gallery poster.

Composition: the upper half is a field of hot pink and electric blue fluid marbling, with liquid swirls and ripples like ink poured on water. Across the middle, the image is torn by a stack of horizontal displacement bands that shift slices of the marbling sideways and smear them into fine streaks. From the lower edge of the tear, vertical pixel-sorted drips pour straight down into the bottom half in streaks of red, orange, pale yellow and cyan, over a deep navy-black ground. Toward the right edge, a few rectangular blocks of cyan and blue scan-line texture break through, like fragments of a broken screen. Large calm areas of colour balance the damaged zones, and the energy runs from the swirls at the top down through the drips.

Typography: a thin, light geometric sans-serif in white capitals, set with extremely wide letter-spacing so each letter floats on its own, plus a small lowercase line. Set exactly this text: "DATA" on one line and "BLOOM" on the line below, sitting inside the torn middle band; "hold still" small and lowercase in the lower right.

Colours: hot pink, electric blue, red channel #FF0040, cyan channel #00FFD1, blown white #F2F2F2 in the brightest streaks, and dead pixel black #0B0B0D in the deep ground, with small touches of orange and pale yellow in the drips.

Light: self-lit screen colour, with blown-out highlights where the pixel sorting is brightest.

Finish: real digital corruption: crisp stair-stepped pixel blocks, sharp horizontal tears, clean vertical sort streaks, fine scan lines and a little compression noise, set against smooth, glossy marbled colour.

Format: Tall portrait (2:3). Show the flat poster artwork itself, edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, small credit columns, names, logos or signatures.

Avoid: random noise with no structure, muddy colour, soft pastels, organic paper textures, copying any existing poster.
```

**If it misses:** Give the glitch more structure: cleaner horizontal tears across the middle, longer vertical pixel-sort drips below, and calmer marbled areas above. Keep the lettering exactly as it is.

## 31. Blueprint

- Slug: `blueprint`
- Artwork: Architectural presentation drawing (Cyanotype and ink-and-watercolour, split sheet)
- Format: tall 2:3
- Cover: `public/covers/blueprint.png`

```text
An original architectural presentation drawing of a modern glass-and-concrete mid-rise tower on a city street corner, drawn in two-point perspective from a low street-level viewpoint on one tall sheet.

Composition: the tower's corner rises up the centre of the sheet, with a curtain wall of glass panels, slim concrete floor slabs, recessed balconies and a double-height glass lobby at street level. Neighbouring buildings, street lights, a few trees and two simplified parked cars recede toward the vanishing points. A clean diagonal split runs from the upper left to the lower right corner, dividing the sheet. On the left, the drawing is a cyanotype blueprint: fine white linework on Prussian blue. On the right, the same drawing continues seamlessly as blue ink and loose watercolour washes on cream drawing paper, with the glass rendered in layered transparent blues and splashes of wash bleeding past the lines. Long construction lines and perspective guides overshoot the building edges and run off toward the vanishing points on both halves. A small ruled title block sits in the lower right corner.

Typography: small, even technical capitals, hand-lettered with a stencil guide. Set exactly this text in the title block: "ARCHITECTURAL STUDY", "SHEET 04", "SCALE 1:200". A few dimension numbers may appear along the construction lines.

Colours: Prussian blue #1B3F7A and deep blue #0F2750 on the blueprint half, chalk white #EAF1FA linework, faded blue #5F86C0 in the washes and fainter lines, and warm cream paper on the watercolour half.

Light: flat, even light, as on a scanned drawing sheet.

Finish: precise, mechanical ruled lines and hand-drawn sketch lines together; slightly mottled cyanotype paper with a soft fold crease on the blue half; visible watercolour blooms, granulation and paper tooth on the cream half.

Format: Tall portrait (2:3). Show it as a flat archival scan of the complete sheet, evenly lit and filling the image edge to edge, with no desk, frame or hands.

Text: spell the title-block lettering exactly as written; apart from dimension numbers, add no other words, logos, watermarks or signatures.

Avoid: full-colour photoreal rendering, 3D CGI, soft focus, clutter that hides the tower.
```

**If it misses:** Make the diagonal split cleaner and keep the drawing continuous across it: crisp white lines on blue on one side, loose blue watercolour on cream on the other. Keep the title-block text exactly as it is.

## 32. Italo Disco

- Slug: `italo-disco`
- Artwork: 1984 12-inch maxi-single cover (Airbrush on board, chrome lettering)
- Format: square 1:1
- Cover: `public/covers/italo-disco2.png`

```text
The original front cover of a 1984 Italo disco 12-inch maxi single, painted in airbrush and gouache on illustration board, with chrome lettering.

Composition: a glamorous dancer in a silver metallic jumpsuit, oversized shoulders and dark visor sunglasses strikes a mid-dance pose, one arm raised, seen slightly from below, standing on a glowing neon grid dance floor that floats in deep space. Above, a huge mirror ball scatters beams of light; pink and blue laser beams cross behind the dancer and fan out to the edges. A ringed planet and a trail of stars fill the background, and a sweep of neon tubes curves around the lower half like a light ribbon. Symmetrical and iconic, with the dancer as the clear centre and the title across the top.

Typography: sleek, wide, italic chrome capitals with sharp beveled edges and star-glint highlights for the name, a thin neon-script line for the title, and a small clean sans-serif line. Set exactly this text: "STELLA NOVA" in large chrome letters across the top; "Midnight Orbit" in pink neon script beneath it; "Extended Dance Mix" small along the bottom.

Colours: space navy #0D0A24 background, laser pink #E83FB4, chrome blue #8FD3FF, spotlight gold #FFD86B, with silver chrome and white highlights.

Light: neon rim light in pink and blue around the dancer, laser beams, mirror-ball sparkles and hard specular glints on every metallic surface.

Finish: hand-airbrushed acrylic on board: smooth sprayed gradients on the chrome and the metallic suit, crisp masked edges on the lettering and lasers, four-point star glints flicked in white paint, fine glitter specks and faint board texture. Stylish, synthetic and made for dancing, not a modern 3D render.

Format: Square (1:1). Show the flat sleeve artwork itself, edge to edge, not a vinyl mockup.

Text: spell the lettering exactly as written; add no other words, record-label logos or signatures.

Avoid: natural daylight, paper texture, earth tones, modern 3D rendering, the likeness of a real performer.
```

**If it misses:** Make it look hand-airbrushed: smoother chrome gradients, crisper laser edges and star glints, and faint board texture. Keep the lettering exactly as it is.

## 33. Grunge

- Slug: `grunge`
- Artwork: 1993 underground gig flyer (Photocopy, paste-up and marker)
- Format: tall 2:3
- Cover: `public/covers/grunge.png`
- Save as: `public/covers/grunge.png`

```text
An original 1993 flyer for an underground grunge gig, made by hand with a photocopier, scissors, glue and tape, then photographed flat as a found object.

Composition: a grainy, high-contrast photocopied photograph of a band playing in a cramped basement, shot with harsh flash, fills the middle of the sheet at a slight tilt, its edges torn. Around and over it, pieces are pasted and taped at crooked angles: a strip of newspaper, a scrap of lined notebook paper, a torn piece of flannel-patterned paper, a band name made from distressed letters, and a hand-scrawled date in black marker. Layers overlap and some are cut off by the sheet's edges. Masking tape, a staple, a coffee ring and fold creases add wear. It looks chaotic and improvised, but the band photo and the band name stay the clear focal points.

Typography: a mix of distressed, broken typewriter letters, rough stencil capitals with photocopy breakup, and fast handwritten marker. Set exactly this text: "WORN VELVET" as the band name in large distressed letters; "live at the basement" in typewriter letters; "fri 9.4.93" in handwritten marker.

Colours: soot black #2B2A26 toner, army olive #6B6A3F, rust #A8542E and dirty cream #D9CDB0 paper, all muted, dim and slightly dirty.

Light: dim, underexposed light with crushed blacks, like a flyer photographed under a basement bulb.

Finish: heavy photocopy grain and toner speckle, scratches, torn fibrous edges, crumpled paper, stains, uneven glue and tape that has yellowed. Raw, imperfect and authentic, the opposite of clean corporate design.

Format: tall portrait (2:3). Show the whole flyer, flat and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, real band names, logos or signatures.

Avoid: clean glossy surfaces, bright pastels, perfect alignment, neat grids, the likeness of a real person or band.
```

**If it misses:** Make it rougher and dirtier: heavier photocopy grain, torn edges, crooked tape and crushed blacks, and keep the lettering exactly as it is.

## 34. Punk

- Slug: `punk`
- Artwork: 1977 punk fanzine cover (Xerox, cut-and-paste and marker)
- Format: tall 2:3
- Cover: `public/covers/punk.png`
- Save as: `public/covers/punk.png`

```text
The original cover of a 1977 punk fanzine, made in one night with scissors, glue, a typewriter and an office photocopier, then photographed flat.

Composition: a harsh, high-contrast xeroxed photograph of a young crowd at a sweaty gig, blown out by flash, is cut roughly and pasted at a sharp tilt across the middle of the page. Across the top, the zine's name is spelled out in ransom-note letters cut from different newspapers and magazines, each a different size, typeface and angle. A single strip of fluorescent pink is slapped diagonally across one corner, and a fluorescent yellow sticker with a hand-drawn arrow points at the headline. Typed captions sit on crooked paper strips held by tape and a real safety pin. Scrawled marker slogans run up one edge. Everything is rough, fast and off-kilter, but the title and the photo hit first.

Typography: ransom-note letters cut from printed media for the title, bashed-out typewriter text on the strips, and angry handwritten marker. Set exactly this text: "RIOT TAPE" as the ransom-note title; "issue 3 · 1977" typed on a paper strip; "no masters no rules" in handwritten marker.

Colours: toner black #0F0F0F on xerox white #F0EEE7, with fluoro pink #FF2E88 and fluoro yellow #F4E12B as the only colour accents.

Light: harsh, flat light like a photocopier scan, with blown-out highlights and deep blacks.

Finish: crunchy high-contrast photocopy with toner specks and streaks, scissor-cut and torn edges, visible glue lumps, shiny tape, creases and smudged ink. Attitude and immediacy over polish.

Format: tall portrait (2:3). Show the whole cover, flat and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, real band names, logos, political figures or signatures.

Avoid: polished gradients, elegant serif type, soft pastels, neat alignment, the likeness of a real person.
```

**If it misses:** Make it rawer: harsher photocopy contrast, more crooked cut-out letters and messier tape, and keep the lettering exactly as it is.

## 35. Minimalism

- Slug: `minimalism`
- Artwork: 1968 minimal art exhibition poster (Screen print)
- Format: tall 2:3
- Cover: not yet
- Save as: `public/covers/minimalism.png`

```text
An original 1968 poster for an exhibition of minimal art, screen-printed in two quiet inks on heavy chalk-white paper.

Composition: almost the whole sheet is empty white space. Placed precisely off-centre, slightly above the middle and to the right, sits one solid graphite rectangle, tall and narrow, with a small stone-grey square resting against its lower left corner. Nothing else competes with them. A small, carefully aligned block of text sits in the lower left corner, lined up with an invisible grid and the edge of the rectangle. The balance between the two forms and the empty paper is exact and calm, with every element essential.

Typography: a precise, light neo-grotesque sans-serif, all lowercase, small, with generous letter-spacing and one clear hierarchy. Set exactly this text: "reduction" slightly larger; "works on paper · 1968" small beneath it.

Colours: chalk white #EEEBE5 paper as the dominant field, graphite #2B2B2A for the rectangle and text, stone #C8C2B8 for the small square, and warm grey #8E8A82 only if a second text weight needs it.

Light: soft, even, diffuse light across the sheet, with no shadows.

Finish: flat, opaque screen-print ink with perfectly crisp edges, the faint tooth of heavy uncoated paper, and nothing decorative.

Format: tall portrait (2:3). Show it as a flat archival scan of the complete poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, logos or signatures.

Avoid: clutter, extra shapes, gradients, textures, bright colours, centred symmetry.
```

**If it misses:** Remove everything except the graphite rectangle, the small grey square and the text block, and add more empty white space around them. Keep the lettering exactly as it is.

## 36. Deconstructivism

- Slug: `deconstructivism`
- Artwork: 1991 design lecture poster (Offset print with overprinted layers)
- Format: tall 2:3
- Cover: `public/covers/deconstructivism.png`
- Save as: `public/covers/deconstructivism.png`

```text
An original 1991 poster for an architecture and design lecture series, in the deconstructivist style, offset-printed on uncoated paper with overlapping transparent ink layers.

Composition: controlled chaos built on a broken grid. Two grids are laid over each other, one straight and one rotated about 15 degrees, and every element snaps to one or the other so they collide. Shards of a black-and-white axonometric architectural drawing (tilted planes, folded steel cladding, splintered beams) cut across the sheet from the upper left. The title is split into fragments: its letters are sliced, shifted along the skewed grid and partly overprinted, some cropped by the edge of the sheet, yet still just readable. Small columns of text run at conflicting angles, one vertical and one slanted, overlapping a fine hatched field. A single sharp oxide-red wedge slices diagonally through the centre. Dynamic and unstable, but every collision looks deliberate.

Typography: a bold grotesque for the fragmented title and a small, light sans-serif for the details, set on the two clashing grids. Set exactly this text: "UNBUILT" as the fragmented title; "lectures on architecture and design" small; "fall 1991" small.

Colours: pale zinc #E6E4DF paper, carbon #1E2124 and steel grey #8A8F94 inks, with oxide red #C84B31 used only for the wedge.

Light: flat, even light, like a scan of a printed poster.

Finish: crisp offset ink with transparent overprints where layers cross, fine hairline drafting lines, a little registration drift and faint paper grain.

Format: tall portrait (2:3). Show it as a flat archival scan of the complete poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written, even where the title is fragmented; add no other words, logos or signatures.

Avoid: calm symmetry, soft rounded forms, pastels, random mess with no underlying grid, gradients.
```

**If it misses:** Make the collisions more deliberate: two clear clashing grids, sharper sliced letters on the title and one clean oxide-red wedge. Keep the lettering exactly as it is.

## 37. New Wave

- Slug: `new-wave`
- Artwork: 1981 new wave magazine cover (Photo collage with airbrush and offset print)
- Format: tall 2:3
- Cover: `public/covers/new-wave.png`
- Save as: `public/covers/new-wave.png`

```text
The original cover of an invented 1981 new wave art and music magazine: a bright, playful photo collage with airbrushed shapes and offset printing, experimental and typographic.

Composition: a big, bold masthead runs across the top in yellow block letters on a navy band. At the centre, a pastel-tinted photo portrait of an invented young man with feathered hair sits inside a stack of rotated squares and diamonds in red, rose pink and orange, like a window turned on its corner, with a solid black bar across his eyes. Floating around him at playful angles are cut-out objects: a silver fish, a painted theatre mask, a paper airplane, a small origami bird and a starburst. The background fades from pale yellow to pink, broken up by geometric pieces: a grid of small coloured squares, dotted patterns, thin stepped lines, zigzags and colour bars along the bottom edge. Small vertical and angled lines of text break the grid. Layered, energetic and spontaneous, with the portrait as the clear focal point.

Typography: a deliberate mix of type styles: chunky block capitals for the masthead, a light extended sans-serif set vertically, small condensed capitals and a few letters in outline. Set exactly this text: "TIDE" as the masthead; "new music · new art · new wave" small and vertical along the left edge; "issue 12" small in the lower right.

Colours: sleeve white #EDEBE6, night navy #111827, neon rose #FF4F9A and cool cyan #62D2E8, with bright sunny yellow, tangerine orange and red, and soft pastel pink and yellow in the background.

Light: bright and flat, with airbrushed gradients in the background and a soft glow around the central shapes.

Finish: offset print with crisp colour, airbrushed pastel gradients, coarse dot screens, slightly grainy photo cut-outs with hand-cut edges and faint paper texture, assembled by hand before computers, bridging modernist grids and postmodern play.

Format: tall portrait (2:3). Show the flat magazine cover artwork itself, edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, barcodes, real magazine names, logos or signatures.

Avoid: the likeness of a real person, copying any existing magazine cover, muted earth tones, neat centred symmetry, modern digital gradients.
```

**If it misses:** Make it more layered and playful: stronger rotated squares around the portrait, more floating cut-out objects and geometric patterns, and brighter pastel colours. Keep the lettering exactly as it is.

## 38. Post-Modernism

- Slug: `post-modernism`
- Artwork: 1986 postmodern design exhibition poster (Collage, screen print and cut-out type)
- Format: tall 2:3
- Cover: `public/covers/post-modernism.png`
- Save as: `public/covers/post-modernism.png`

```text
An original 1986 poster for a design exhibition in the postmodern style: loud, eclectic and ironic, made from cut-out type and a dense collage, then screen-printed.

Composition: a black background. The top third is a wild collage border of torn magazine scraps, splashes of paint, stickers, stripes, dots, checkerboards, squiggles, halftone photo fragments and small classical ornaments, all in clashing bright colours, spilling in from the top and side edges. Across the middle, the title is built from huge, mismatched cut-out letters: every letter is a different typeface, size, weight and colour, some tilted, some overlapping, some cut off, like a ransom note made with joy instead of anger. Below it, the style name is broken into chunky fragments that stack and collide on a grid that has clearly been broken. Small blocks of information in bright coloured type sit at the bottom corners. Complex and contradictory, but the title reads first.

Typography: a deliberate clash of historical and modern styles: a slab serif, a Victorian decorative letter, a bold grotesque, an outlined letter, a script letter and a stencil letter, mixed within the same words. Set exactly this text: "ANYTHING GOES?" as the huge title; "POST MODERNISM" in chunky broken fragments below it; "an exhibition of design" small in the lower left; "march 1986" small in the lower right.

Colours: black background, with salmon pink #F2D7CF, mint #9FC7C0, ultramarine #3C4C8C and sand yellow #E7C35A, plus hot red, orange, bright green and white for the clashing letters and collage.

Light: flat, bright colour, like a scan of a printed poster.

Finish: crisp screen-print ink on the letters, real cut-paper edges and small shadows in the collage, visible halftone dots, paint texture and faint paper grain.

Format: tall portrait (2:3). Show it as a flat archival scan of the complete poster, evenly lit and filling the image edge to edge, with no wall, frame, mockup or hands.

Text: spell the lettering exactly as written; add no other words, website addresses, prices, logos or signatures.

Avoid: austere minimalism, monochrome, neat grids, a single typeface, copying any existing poster.
```

**If it misses:** Make the title letters clash more: every letter in a different typeface, size and colour, some tilted and overlapping, and keep the collage at the edges so the title stays readable. Keep the lettering exactly as it is.

