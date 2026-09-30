/**
 * The short description shown at the top of each style page: what the style
 * is in general (its origins, ideas and defining traits), in two or three
 * plain sentences. It describes the style, never a particular image. Every
 * style needs one (the content tests check).
 */
export const descriptions: Record<string, string> = {
  // ——— Movements ———
  swiss:
    "A school of graphic design that emerged in Switzerland in the 1950s, led by designers such as Josef Müller-Brockmann and Armin Hofmann. It aims for objective, universal communication, organising everything on a mathematical grid with sans-serif type such as Helvetica and Univers. Its clarity became the foundation of modern corporate identity and signage.",
  bauhaus:
    "A German school of art, architecture and design that ran from 1919 to 1933 in Weimar, Dessau and Berlin. It set out to unite art, craft and industry, reducing form to basic geometry and primary colour under the belief that form follows function. Its ideas shaped modern architecture, furniture, typography and design teaching worldwide.",
  constructivism:
    "An avant-garde movement that began in Russia around 1915, with artists such as Vladimir Tatlin, Alexander Rodchenko and El Lissitzky. It rejected art for art's sake in favour of art as construction serving society, especially the revolution. Its dynamic diagonals, photomontage and bold typography deeply influenced modern graphic design.",
  "art-deco":
    "A decorative style that flourished in the 1920s and 1930s, named after the 1925 Paris Exposition des Arts Décoratifs. It blends modern geometry with luxury, combining symmetry, stepped forms, sunbursts and chevrons with materials like chrome, lacquer and gold. It appeared everywhere from skyscrapers and ocean liners to jewellery and posters.",
  "art-nouveau":
    "An international style of art and design from about 1890 to 1910, known as Jugendstil in Germany and Secession in Austria. Inspired by nature, it favours long, flowing lines, plant forms and graceful figures, and sought to erase the divide between fine and applied art. Alphonse Mucha, Gustav Klimt and Hector Guimard are among its best-known names.",
  modernism:
    "The broad movement in art, architecture and design of the early to mid twentieth century that broke with historical tradition. It valued rational structure, function, honest materials and the removal of ornament. Many schools grew under its umbrella, including Bauhaus, De Stijl and the International Style.",
  minimalism:
    "An art movement that emerged in New York in the 1960s, with artists such as Donald Judd, Agnes Martin and Dan Flavin. It reduces a work to its essentials: simple geometric forms, repetition, industrial materials and no personal expression. The idea later spread into design, architecture and music as a philosophy of less is more.",
  brutalism:
    "An architectural movement of the 1950s to 1970s, named after béton brut, French for raw concrete. Influenced by Le Corbusier, it favoured massive, monolithic buildings with exposed concrete, repeated modules and honest structure. It was widely used for public housing, universities and civic buildings, and remains both admired and controversial.",
  "mid-century-modern":
    "The design movement of roughly 1945 to 1970, centred in the United States and Scandinavia. Designers such as Charles and Ray Eames, Arne Jacobsen and Eero Saarinen combined clean lines, organic curves and new materials like moulded plywood and fibreglass. Its optimism, warmth and function made good design part of everyday life.",
  "post-modernism":
    "A movement of the 1970s and 1980s that reacted against the strict rules of modernism. Architects and designers such as Robert Venturi and Michael Graves brought back ornament, historical references, colour and humour, often with irony. It celebrated complexity and contradiction over purity.",
  deconstructivism:
    "An architectural movement that came to prominence in the late 1980s, launched by a 1988 exhibition at New York's Museum of Modern Art. Architects such as Frank Gehry, Zaha Hadid and Daniel Libeskind fragmented buildings into tilted, colliding forms that challenge ideas of harmony and stability. Graphic designers of the 1990s adopted the same broken, layered approach.",
  "pop-art":
    "An art movement that emerged in Britain and the United States in the 1950s and 1960s. Artists such as Andy Warhol, Roy Lichtenstein and Richard Hamilton took imagery from advertising, comics and mass-produced goods and presented it as fine art. It blurred the line between high art and popular culture.",
  memphis:
    "A design group founded in Milan in 1981 by Ettore Sottsass, active until 1987. It rejected good taste and functionalism with furniture and objects in bold geometric shapes, clashing colours and loud laminate patterns. Its playful, provocative spirit has repeatedly returned in fashion and graphics.",
  "baroque-tenebrism":
    "A painting style of the early seventeenth century, pioneered by Caravaggio and taken up by followers across Europe. Tenebrism is the most extreme form of Baroque chiaroscuro: dramatic contrasts of light and dark, where figures emerge from deep shadow under a single strong light. It gave religious and everyday scenes a new realism and theatrical power.",
  psychedelic:
    "A style that grew out of 1960s counterculture and rock music, centred on San Francisco. Inspired by Art Nouveau and Op Art, artists such as Wes Wilson and Victor Moscoso created concert posters with warped lettering, vibrating colours and swirling patterns. It aimed to evoke altered states of mind.",
  naive:
    "Art made by self-taught artists without formal training, admired since Henri Rousseau in the late nineteenth century. It is known for flattened perspective, simplified figures, bright unmixed colour and painstaking detail. Its sincerity and directness influenced modern artists who valued it as a fresh, unschooled vision.",

  // ——— Print, type and technique ———
  "experimental-type":
    "An approach to typography that treats letters as visual material rather than just carriers of text. It runs from Futurist and Dada experiments of the 1910s to the digital work of designers such as David Carson and the Emigre foundry in the 1990s. Legibility is often sacrificed for expression, rhythm and texture.",
  "80s-editorial":
    "The graphic language of 1980s magazines, when titles such as The Face and i-D redefined editorial design. Designers such as Neville Brody mixed bold typography, flat colour, striking flash photography and unconventional layouts. It turned the magazine page into a statement of youth culture and style.",
  editorial:
    "The design of magazines, newspapers and books, focused on guiding the reader through content. It relies on a strong grid, a clear typographic hierarchy, careful pairing of image and text, and generous white space. Good editorial design balances art direction with readability.",
  "type-doodles":
    "An informal, hand-drawn approach to lettering where words are surrounded by doodles such as stars, arrows and small characters. It grew from sketchbook and notebook culture and is popular in illustration, zines and social media. Its charm lies in imperfection and a personal, playful touch.",
  handwritten:
    "Lettering made by hand with pen, brush or marker, as opposed to set type. It ranges from everyday script to expressive brush lettering, and carries the character and rhythm of the writer's hand. It is valued for warmth, intimacy and authenticity.",
  "tech-spec":
    "A contemporary design trend that borrows the visual language of engineering datasheets, product manuals and hardware packaging. It relies on leader lines, numbered callouts, dimensions, part numbers and monospace labels. It presents objects with a precise, technical and industrial sensibility.",
  blueprint:
    "Named after the cyanotype printing process invented in the 1840s and used for engineering and architectural drawings until the late twentieth century. Blueprints show white lines on a deep blue ground, with plans, sections and precise measurements. Today the look stands for invention, engineering and technical precision.",
  "collage-art":
    "An art technique of assembling different materials, such as paper, photographs and printed matter, into a new whole. Picasso and Braque brought it into fine art around 1912, and Dada artists such as Hannah Höch developed it into photomontage. It remains a key method for commentary, juxtaposition and surprise.",
  graffiti:
    "Writing and painting on public surfaces, which in its modern form grew out of 1970s New York, where writers painted subway trains. It developed elaborate lettering styles such as wildstyle, with interlocking letters, arrows and 3D effects. Closely tied to hip-hop culture, it has since moved from the street into galleries.",
  "pixel-art":
    "A form of digital art where images are built pixel by pixel, rooted in the limited graphics of 1980s and 1990s video games and computers. Artists work with small palettes, low resolutions and techniques like dithering. Today it thrives as a deliberate style valued for its clarity and nostalgia.",
  "vector-minimalism":
    "A modern illustration approach that reduces subjects to a few flat geometric shapes, without outlines, texture or gradients. It relies on negative space and a limited palette to suggest form. It became popular in digital design, icons and flat illustration from the 2010s.",
  "vector-art":
    "Digital illustration built from mathematically defined shapes and curves rather than pixels, so it scales without losing quality. It is known for crisp edges, bold forms and flat or layered shading. Widely used for branding, editorial and web illustration since software like Adobe Illustrator.",
  "clay-style":
    "An aesthetic based on clay and plasticine modelling, rooted in stop-motion animation such as the work of Aardman Animations. It features soft, rounded forms, visible fingerprints and handmade imperfections. Today it is often recreated digitally for its tactile, friendly charm.",
  glitch:
    "An art form that uses digital or analogue errors as its material. Since the early 2000s, artists have deliberately corrupted files, bent circuits and broken video signals to reveal the hidden structure of technology. Its split colours, scan lines and pixel smears question our trust in digital media.",

  // ——— Periods and scenes ———
  grunge:
    "A 1990s style tied to the alternative rock scene of Seattle and the music of bands such as Nirvana. In graphic design, David Carson's Ray Gun magazine made it famous with distressed type, photocopied textures and chaotic layouts. It stood for rebellion against polished, corporate aesthetics.",
  punk:
    "The do-it-yourself visual culture of the mid-1970s punk movement in London and New York. Flyers, zines and record sleeves, such as Jamie Reid's work for the Sex Pistols, used photocopies, ransom-note lettering and raw collage. It rejected polish and authority in favour of anger, speed and self-expression.",
  "new-wave":
    "The graphic style of the late 1970s and 1980s, linked to new wave music and to a new direction in typography. Designers such as Wolfgang Weingart and April Greiman loosened the strict Swiss grid, layering type, texture and geometric shapes. It blended structure with playfulness and paved the way for digital design.",
  "70s-retro":
    "A revival style inspired by the popular culture and design of the 1970s. It draws on earthy colours, rainbow stripes, rounded display lettering and the warm, relaxed spirit of the era. It celebrates the decade's optimism, disco and groovy mood.",
  retro:
    "A broad term for styles that imitate the design of the recent past, usually from the 1930s to the 1970s. It recalls vintage print, with limited ink colours, halftones, aged paper, badges and hand-painted signs. It is driven by nostalgia rather than one specific period.",
  gothic:
    "Originally the architecture of medieval Europe from the twelfth to the sixteenth century, known for pointed arches, ribbed vaults and stained glass. The nineteenth-century Gothic Revival and Gothic literature added a dark, romantic mood. Today the term also covers a wider culture of mystery, melancholy and ornate darkness.",
  "victorian-style":
    "The art and design of Queen Victoria's reign in Britain, from 1837 to 1901. It is known for rich ornament, dense botanical patterns, fine engraving and a love of mixing historical styles. The Arts and Crafts movement, led by William Morris, grew from this era.",

  // ——— Internet and music aesthetics ———
  synthwave:
    "A music genre and visual aesthetic that emerged in the late 2000s, inspired by 1980s film soundtracks, video games and synth music. Its imagery imagines a neon-lit version of the 1980s future. It sits within a wider wave of internet-era retro-futurism.",
  "italo-disco":
    "A genre of electronic dance music that originated in Italy in the late 1970s and flourished in the 1980s. Its record sleeves became famous for airbrushed chrome, space imagery and glamorous futurism. It influenced later electronic music and retro-futurist design.",
  "future-funk":
    "An internet music and visual aesthetic of the 2010s, an upbeat offshoot of vaporwave. It samples 1980s Japanese city pop and pairs it with imagery from anime of the same era. The result is bright, nostalgic and energetic.",
  vaporwave:
    "An internet-born music genre and visual aesthetic of the early 2010s. It remixes the consumer culture, computing and advertising of the 1980s and 1990s with irony and nostalgia. It often comments on capitalism, technology and memory.",
  "gen-x-soft-club":
    "A recently named aesthetic that looks back at the late 1990s and early 2000s. It draws on chill electronic music, club culture, portable technology and minimalist fashion of the time. The mood is calm, cool and softly futuristic.",
  acid:
    "A contemporary graphic trend rooted in the acid house and rave culture of the late 1980s and 1990s. Designers combine liquid chrome lettering, electric colours and heavy digital distortion. It reflects a mix of club nostalgia and experimental digital design.",
  kidcore:
    "An internet aesthetic built around nostalgia for childhood, especially the 1990s and early 2000s. It draws on primary colours, toys, cartoons, stickers and crayon drawings. It celebrates innocence, play and comfort.",
  y2k:
    "The aesthetic of the years around 2000, when the new millennium inspired a wave of techno-optimism. It is known for translucent plastics, chrome, iridescence and futuristic forms. It appeared in fashion, music videos, consumer electronics and early web design.",
  bubbleglam:
    "An informal internet-era aesthetic of glossy, inflated forms and glamour. It combines candy colours, puffy balloon-like shapes, glitter and rhinestones. It sits close to Y2K and celebrates playful, sweet excess.",
  cyberpop:
    "An informal, colourful counterpart to cyberpunk. It uses the language of technology, such as interfaces, holograms and digital icons, but with bright colours and anime-inspired characters rather than dystopia. The mood is optimistic, cute and energetic.",
  chromecore:
    "An aesthetic centred on liquid, reflective chrome, popular in digital art and design since the late 2010s. It overlaps with Y2K and acid graphics. Its mirror-like forms and lettering suggest a sleek, futuristic world.",
  cyberpunk:
    "A science-fiction genre that emerged in the 1980s, shaped by William Gibson's novel Neuromancer and the film Blade Runner. It imagines a near future of high technology and social decay, dominated by corporations and megacities. Its motto, high tech, low life, defines its gritty, neon-lit world.",
  cyberminimalism:
    "An informal design style that pairs digital futurism with minimalist restraint. It uses monochrome surfaces, fine lines, precise data and a single cool accent colour. Technology is suggested through precision rather than clutter.",
  aurora:
    "A digital design trend inspired by the northern lights. It uses large, soft, blurred fields of colour that blend into each other. It became popular in interface and web design as a calm, atmospheric background style.",
  surveillance:
    "A visual aesthetic drawn from security cameras, CCTV and trail cameras. Artists and filmmakers use its high angles, low resolution, timestamps and grainy footage to explore themes of watching and being watched. It raises questions about privacy and control.",
  futuristic:
    "A general design language that imagines the future, not the early-twentieth-century Italian Futurist movement. It draws on space-age architecture, science fiction and advanced technology, with seamless forms and luminous surfaces. It expresses optimism about progress.",
  "surreal-design":
    "A contemporary approach inspired by Surrealism, the art movement founded in Paris in 1924 by André Breton. Like René Magritte and Salvador Dalí, it places ordinary objects in impossible situations with calm realism. It aims to surprise and to unlock the logic of dreams.",
  "luxury-minimal":
    "A contemporary aesthetic that combines minimalism with premium materials such as stone, cashmere and brass. It is associated with high-end fashion, beauty and interior brands. Restraint, quality and calm are its core values.",
  maximalism:
    "An approach to design that embraces abundance, the opposite of minimalism's less is more. It layers pattern on pattern, rich colour, collections and decoration. It draws on Victorian interiors, eclectic taste and personal expression.",
  steampunk:
    "A retro-futuristic genre that imagines steam-powered technology in a nineteenth-century setting. The term was coined in 1987 by writer K. W. Jeter, and the style draws on Victorian engineering and writers such as Jules Verne and H. G. Wells. It spans literature, fashion, art and design.",
  bohemian:
    "A relaxed, free-spirited style named after the unconventional artists and writers of nineteenth-century Paris. In design, it combines layered textiles, global patterns, plants and natural materials. It values comfort, creativity and a collected, lived-in feel.",

  // ——— Interfaces ———
  "web-1-0":
    "The design of the early World Wide Web in the 1990s, when personal homepages were built by hand on services such as GeoCities. It is known for tiled backgrounds, default fonts, animated GIFs and visitor counters. It reflects an amateur, experimental and unpolished era of the internet.",
  "web-2-0-gloss":
    "The interface style of the mid-2000s, when the web became social and interactive. It was defined by glossy buttons, reflections, gradients and rounded badges. It signalled the arrival of a friendlier, more polished web.",
  skeuomorphism:
    "A design approach where digital interfaces imitate real-world materials and objects. It was dominant in software and apps until around 2013, with leather textures, wood grain and realistic buttons. It helped users understand new technology through familiar forms.",
  neumorphism:
    "A soft interface design trend that emerged around 2019 and 2020. Elements appear extruded from or pressed into the background using subtle highlights and shadows. It combines minimalism with a gentle, tactile quality.",
  glassmorphism:
    "An interface design trend popularised around 2020, notably by operating systems such as macOS Big Sur. It uses frosted-glass panels with background blur, transparency and thin borders. It creates a sense of depth and lightness.",
  neubrutalism:
    "A contemporary web and graphic design style of the 2020s. Borrowing its name from architectural brutalism, it embraces raw, unpolished visuals: flat bright colour, thick black outlines, hard shadows and blunt type. It rejects smooth, overly refined interfaces.",
};
