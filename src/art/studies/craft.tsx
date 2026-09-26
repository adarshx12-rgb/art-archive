import { Grain, H, W, gearPath, range, rng, type Renderer } from "../util";

export const craftStudies: Record<string, Renderer> = {
  "vector-minimalism": ([sand, teal, terracotta, wheat]) => (
    <>
      <rect width={W} height={H} fill={sand} />
      <circle cx={250} cy={180} r={62} fill={terracotta} />
      <path d="M0 400 L130 210 L260 400 Z" fill={teal} />
      <path d="M170 400 L290 250 L400 400 Z" fill={wheat} />
      <rect x={0} y={400} width={W} height={100} fill={teal} />
      <path d="M130 210 L160 254 L100 254 Z" fill={sand} />
    </>
  ),

  "vector-art": ([cream, navy, tangerine, jade]) => (
    <>
      <rect width={W} height={H} fill={cream} />
      <circle cx={280} cy={150} r={70} fill={tangerine} />
      <circle cx={280} cy={150} r={50} fill="#FFB86B" />
      <path d="M0 320 C 80 260, 180 280, 260 320 S 380 300, 400 290 V 500 H 0 Z" fill={jade} />
      <path d="M0 360 C 100 330, 200 350, 300 380 S 380 370, 400 360 V 500 H 0 Z" fill="#137A6F" />
      <path d="M0 420 C 120 400, 260 410, 400 440 V 500 H 0 Z" fill={navy} />
      {[
        [80, 330, 1],
        [140, 350, 0.8],
        [330, 360, 1.1],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x={-4} y={0} width={8} height={40} fill={navy} />
          <path d="M0 -70 L30 10 L-30 10 Z" fill="#0F5E55" />
          <path d="M0 -70 L30 10 L0 10 Z" fill={navy} opacity={0.35} />
        </g>
      ))}
      <path d="M40 120 q 20 -14 40 0 q 20 -14 40 0" fill="none" stroke={navy} strokeWidth={4} strokeLinecap="round" />
    </>
  ),

  "clay-style": ([peach, coral, blue, butter], u) => (
    <>
      <defs>
        {[coral, blue, butter].map((c, i) => (
          <radialGradient key={i} id={`${u}c${i}`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
            <stop offset="0.35" stopColor={c} />
            <stop offset="1" stopColor={c} />
          </radialGradient>
        ))}
        <filter id={`${u}sh`}>
          <feDropShadow dx={0} dy={10} stdDeviation={8} floodOpacity={0.22} />
        </filter>
        <filter id={`${u}lump`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.02} numOctaves={2} seed={2} />
          <feDisplacementMap in="SourceGraphic" scale={10} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={peach} />
      <ellipse cx={200} cy={440} rx={170} ry={26} fill={coral} opacity={0.3} />
      <g filter={`url(#${u}sh)`}>
        <g filter={`url(#${u}lump)`}>
          <ellipse cx={200} cy={330} rx={110} ry={100} fill={`url(#${u}c0)`} />
          <circle cx={200} cy={190} r={72} fill={`url(#${u}c2)`} />
          <ellipse cx={320} cy={400} rx={46} ry={40} fill={`url(#${u}c1)`} />
          <ellipse cx={80} cy={410} rx={36} ry={30} fill={`url(#${u}c1)`} />
        </g>
      </g>
      <circle cx={176} cy={184} r={9} fill="#2A2A2A" />
      <circle cx={224} cy={184} r={9} fill="#2A2A2A" />
      <circle cx={179} cy={181} r={3} fill="#FFFFFF" />
      <circle cx={227} cy={181} r={3} fill="#FFFFFF" />
      <path d="M186 214 Q 200 226 214 214" fill="none" stroke="#2A2A2A" strokeWidth={5} strokeLinecap="round" />
      <circle cx={160} cy={212} r={9} fill={coral} opacity={0.6} />
      <circle cx={240} cy={212} r={9} fill={coral} opacity={0.6} />
      <Grain u={u} opacity={0.12} />
    </>
  ),

  naive: ([gesso, leaf, red, night], u) => {
    const r = rng(8);
    return (
      <>
        <rect width={W} height={H} fill={night} />
        <circle cx={310} cy={80} r={34} fill="#F3E3A0" />
        <rect x={0} y={300} width={W} height={200} fill="#4E7F3E" />
        <rect x={130} y={220} width={140} height={110} fill={red} />
        <path d="M120 222 L200 160 L280 222 Z" fill="#6E2A1F" />
        <rect x={185} y={270} width={30} height={60} fill={night} />
        <rect x={148} y={240} width={24} height={24} fill="#F3E3A0" />
        <rect x={228} y={240} width={24} height={24} fill="#F3E3A0" />
        {range(38).map((i) => {
          const x = r() * W;
          const y = 330 + r() * 170;
          const a = (r() - 0.5) * 80;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
              <ellipse rx={10} ry={30} fill={i % 2 ? leaf : "#3D8A48"} />
              <line x1={0} y1={-28} x2={0} y2={28} stroke={gesso} strokeWidth={1} opacity={0.6} />
            </g>
          );
        })}
        <g transform="translate(70 360)">
          <circle cy={-40} r={14} fill="#E7C09A" />
          <rect x={-14} y={-26} width={28} height={50} fill={red} />
        </g>
        <Grain u={u} opacity={0.18} />
      </>
    );
  },

  "surreal-design": ([sand, sky, door, shadow], u) => (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor="#F2E6D6" />
        </linearGradient>
      </defs>
      <rect width={W} height={320} fill={`url(#${u}s)`} />
      <rect x={0} y={320} width={W} height={180} fill={sand} />
      <path d="M180 400 L400 470 L400 500 L150 410 Z" fill={shadow} opacity={0.35} />
      <rect x={150} y={250} width={60} height={150} fill={door} />
      <rect x={156} y={256} width={48} height={138} fill="none" stroke="#7D2B22" strokeWidth={2} />
      <circle cx={198} cy={330} r={3.5} fill="#E8C66A" />
      <circle cx={290} cy={140} r={36} fill="#F7F2EA" />
      <ellipse cx={300} cy={400} rx={36} ry={6} fill={shadow} opacity={0.35} />
      <path d="M70 180 C 90 170, 110 170, 120 180 C 110 190, 90 190, 70 180 Z" fill="#FFFFFF" opacity={0.85} />
    </>
  ),

  "luxury-minimal": ([travertine, cashmere, brass, espresso], u) => (
    <>
      <defs>
        <linearGradient id={`${u}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.4} />
          <stop offset="1" stopColor={espresso} stopOpacity={0.12} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={travertine} />
      <path d="M0 0 L140 0 L0 500 Z" fill="#FFFFFF" opacity={0.18} />
      <rect x={120} y={330} width={160} height={170} fill={cashmere} />
      <rect x={120} y={330} width={160} height={170} fill={`url(#${u}l)`} />
      <path d="M280 330 L400 380 L400 500 L280 500 Z" fill={espresso} opacity={0.12} />
      <path d="M180 330 C 160 290, 165 240, 190 220 L 190 190 L 210 190 L 210 220 C 235 240, 240 290, 220 330 Z" fill={espresso} />
      <rect x={120} y={326} width={160} height={4} fill={brass} />
      <Grain u={u} opacity={0.1} freq={0.6} />
    </>
  ),

  maximalism: ([green, raspberry, saffron, sapphire], u) => (
    <>
      <defs>
        <pattern id={`${u}p`} width={50} height={50} patternUnits="userSpaceOnUse">
          <rect width={50} height={50} fill={green} />
          <circle cx={25} cy={25} r={14} fill={raspberry} />
          <circle cx={25} cy={25} r={6} fill={saffron} />
          <path d="M0 0 L10 0 L0 10 Z M50 50 L40 50 L50 40 Z M50 0 L50 10 L40 0 Z M0 50 L0 40 L10 50 Z" fill={saffron} />
        </pattern>
        <pattern id={`${u}q`} width={24} height={24} patternUnits="userSpaceOnUse">
          <rect width={24} height={24} fill={sapphire} />
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="none" stroke={saffron} strokeWidth={1.5} />
        </pattern>
        <pattern id={`${u}s`} width={16} height={16} patternUnits="userSpaceOnUse">
          <rect width={16} height={16} fill={raspberry} />
          <rect width={8} height={16} fill="#E8B7C5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}p)`} />
      <path d="M60 500 V200 A140 140 0 0 1 340 200 V500 Z" fill={`url(#${u}q)`} stroke={saffron} strokeWidth={8} />
      <rect x={80} y={380} width={240} height={120} rx={20} fill={`url(#${u}s)`} stroke={saffron} strokeWidth={4} />
      <ellipse cx={200} cy={260} rx={50} ry={70} fill={green} stroke={saffron} strokeWidth={6} />
      <circle cx={200} cy={260} r={24} fill={raspberry} />
      {range(7).map((i) => (
        <path key={i} d={`M${100 + i * 33} 380 l 8 -30 l 8 30`} fill={saffron} />
      ))}
    </>
  ),

  gothic: ([raven, oxblood, gold, stone], u) => (
    <>
      <defs>
        <radialGradient id={`${u}c`} cx="0.5" cy="0.8" r="0.6">
          <stop offset="0" stopColor={gold} stopOpacity={0.55} />
          <stop offset="1" stopColor={raven} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={raven} />
      {[70, 200, 330].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 46} 470 V 200 Q ${x - 46} 90 ${x} 50 Q ${x + 46} 90 ${x + 46} 200 V 470 Z`} fill={i === 1 ? oxblood : stone} opacity={i === 1 ? 1 : 0.35} stroke={gold} strokeWidth={i === 1 ? 2.5 : 1} />
          <path d={`M${x} 470 V 120 M${x - 46} 250 H ${x + 46}`} stroke={raven} strokeWidth={4} />
          <circle cx={x} cy={180} r={22} fill="none" stroke={raven} strokeWidth={4} />
          <path d={`M${x} 158 V 202 M${x - 22} 180 H ${x + 22}`} stroke={raven} strokeWidth={3} />
        </g>
      ))}
      <rect width={W} height={H} fill={`url(#${u}c)`} />
      <rect x={192} y={400} width={16} height={60} fill="#E8DCC0" />
      <path d="M200 372 C 190 386, 194 398, 200 400 C 206 398, 210 386, 200 372 Z" fill={gold} />
      <rect x={0} y={470} width={W} height={30} fill={stone} opacity={0.4} />
    </>
  ),

  steampunk: ([walnut, brass, copper, parchment], u) => (
    <>
      <defs>
        <radialGradient id={`${u}m`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#F5D48A" />
          <stop offset="0.5" stopColor={brass} />
          <stop offset="1" stopColor="#6B4A1C" />
        </radialGradient>
        <radialGradient id={`${u}cu`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#E0976A" />
          <stop offset="1" stopColor={copper} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={walnut} />
      <path d={gearPath(150, 200, 110, 18)} fill={`url(#${u}m)`} />
      <circle cx={150} cy={200} r={70} fill={walnut} />
      <circle cx={150} cy={200} r={60} fill={parchment} />
      {range(12).map((i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={150 + Math.cos(a) * 48} y1={200 + Math.sin(a) * 48} x2={150 + Math.cos(a) * 56} y2={200 + Math.sin(a) * 56} stroke={walnut} strokeWidth={2} />;
      })}
      <line x1={150} y1={200} x2={180} y2={168} stroke={copper} strokeWidth={3} strokeLinecap="round" />
      <circle cx={150} cy={200} r={5} fill={walnut} />
      <path d={gearPath(300, 330, 80, 14)} fill={`url(#${u}cu)`} />
      <circle cx={300} cy={330} r={22} fill={walnut} />
      <path d={gearPath(130, 400, 56, 10, 0.2)} fill={`url(#${u}m)`} />
      <circle cx={130} cy={400} r={16} fill={walnut} />
      <path d="M260 40 V 200 H 380" fill="none" stroke={`url(#${u}cu)`} strokeWidth={16} />
      {[60, 120, 180].map((y) => (
        <circle key={y} cx={260} cy={y} r={4} fill={parchment} opacity={0.7} />
      ))}
      <path d="M380 180 C 360 150, 390 130, 370 100 C 360 80, 380 60, 370 40" fill="none" stroke={parchment} strokeWidth={10} strokeLinecap="round" opacity={0.25} />
      <Grain u={u} opacity={0.2} />
    </>
  ),

  bohemian: ([linen, terracotta, olive, turmeric], u) => (
    <>
      <rect width={W} height={H} fill={linen} />
      <path d="M40 500 V190 A 160 160 0 0 1 360 190 V 500 Z" fill={turmeric} opacity={0.35} />
      <circle cx={200} cy={170} r={56} fill={turmeric} />
      {range(9).map((i) => (
        <path key={i} d={`M${100 + i * 25} 40 C ${100 + i * 25} 90, ${110 + i * 25} 110, ${112 + i * 25} ${130 + (i % 3) * 20}`} fill="none" stroke={terracotta} strokeWidth={2.5} strokeDasharray="6 3" />
      ))}
      <rect x={90} y={36} width={230} height={8} fill="#8A5A3B" />
      <path d="M150 470 L 140 380 L 260 380 L 250 470 Z" fill={terracotta} />
      <rect x={134} y={370} width={132} height={18} fill="#A34F2E" />
      {range(9).map((i) => {
        const a = -Math.PI / 2 + (i - 4) * 0.3;
        const x2 = 200 + Math.cos(a) * 130;
        const y2 = 370 + Math.sin(a) * 130;
        return (
          <g key={i}>
            <path d={`M200 370 Q ${(200 + x2) / 2 + (i - 4) * 6} ${(370 + y2) / 2} ${x2} ${y2}`} fill="none" stroke={olive} strokeWidth={3} />
            <ellipse cx={x2} cy={y2} rx={10} ry={22} fill={olive} transform={`rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${x2} ${y2})`} />
          </g>
        );
      })}
      <rect x={0} y={470} width={W} height={30} fill={terracotta} opacity={0.6} />
      {range(20).map((i) => (
        <path key={i} d={`M${i * 20} 485 l10 -8 l10 8 l-10 8 Z`} fill={linen} opacity={0.6} />
      ))}
      <Grain u={u} opacity={0.2} />
    </>
  ),

  "victorian-style": ([indigo, plum, gilt, paper], u) => (
    <>
      <defs>
        <pattern id={`${u}flo`} width={40} height={40} patternUnits="userSpaceOnUse">
          <rect width={40} height={40} fill={indigo} />
          <path d="M20 6 C 26 12, 26 18, 20 22 C 14 18, 14 12, 20 6 Z M20 22 C 28 24, 32 30, 30 36 C 24 34, 20 30, 20 22 Z M20 22 C 12 24, 8 30, 10 36 C 16 34, 20 30, 20 22 Z" fill={plum} />
          <circle cx={0} cy={0} r={3} fill={gilt} opacity={0.6} />
          <circle cx={40} cy={40} r={3} fill={gilt} opacity={0.6} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}flo)`} />
      <ellipse cx={200} cy={240} rx={130} ry={170} fill={gilt} />
      <ellipse cx={200} cy={240} rx={130} ry={170} fill="none" stroke="#7A5A22" strokeWidth={2} strokeDasharray="3 5" />
      <ellipse cx={200} cy={240} rx={110} ry={150} fill={paper} />
      {range(12).map((i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={200 + Math.cos(a) * 120} cy={240 + Math.sin(a) * 160} r={7} fill="#E4C77D" stroke="#7A5A22" />;
      })}
      <g stroke={indigo} strokeWidth={0.9}>
        {range(26).map((i) => (
          <line key={i} x1={130 + i * 5} y1={170} x2={130 + i * 5 - 30} y2={330} opacity={0.35} />
        ))}
      </g>
      <path d="M200 160 C 240 180, 240 250, 200 270 C 160 250, 160 180, 200 160 Z" fill="none" stroke={indigo} strokeWidth={2} />
      <path d="M200 270 V 330 M 200 300 C 220 290, 235 296, 240 310 M 200 290 C 180 280, 165 286, 160 300" fill="none" stroke={indigo} strokeWidth={2} />
      <rect x={70} y={430} width={260} height={46} fill={paper} stroke={gilt} strokeWidth={3} />
      <text x={200} y={461} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={20} letterSpacing={3} fill={plum}>
        THE CURIOSITY
      </text>
    </>
  ),
};
