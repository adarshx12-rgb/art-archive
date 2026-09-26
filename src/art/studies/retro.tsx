import { Grain, H, W, range, rng, starPath, wavyRing, type Renderer } from "../util";

const sans = "'Schibsted Grotesk Variable', Helvetica, Arial, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

export const retroStudies: Record<string, Renderer> = {
  "70s-retro": ([cream, orange, rust, olive], u) => (
    <>
      <rect width={W} height={H} fill={cream} />
      <circle cx={290} cy={140} r={64} fill={orange} opacity={0.9} />
      {[olive, rust, orange, "#E9A93A"].map((c, i) => (
        <path key={i} d={`M-20 ${520} C ${60 + i * 10} ${300 - i * 38}, ${260 - i * 20} ${260 - i * 30}, 420 ${220 - i * 36}`} fill="none" stroke={c} strokeWidth={34} />
      ))}
      <text x={40} y={90} fontFamily="'Cooper Black', 'Georgia', serif" fontWeight={900} fontSize={56} fill={rust}>
        groovy
      </text>
      <Grain u={u} opacity={0.22} />
    </>
  ),

  retro: ([paper, red, teal, mustard], u) => (
    <>
      <rect width={W} height={H} fill={paper} />
      <circle cx={200} cy={230} r={150} fill={teal} />
      <circle cx={200} cy={230} r={138} fill="none" stroke={paper} strokeWidth={3} strokeDasharray="2 7" />
      <circle cx={200} cy={230} r={110} fill={paper} />
      <path d={starPath(200, 220, 70, 30, 5)} fill={red} />
      <path d="M30 330 L370 330 L350 360 L370 390 L30 390 L50 360 Z" fill={red} />
      <text x={200} y={372} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={28} fill={paper} letterSpacing={4}>
        EST. 1950
      </text>
      {[80, 320].map((x) => (
        <path key={x} d={starPath(x, 440, 14, 6)} fill={mustard} />
      ))}
      <text x={200} y={452} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontSize={22} fill={teal}>
        quality goods
      </text>
      <Grain u={u} opacity={0.28} />
    </>
  ),

  synthwave: ([night, magenta, cyan, orange], u) => (
    <>
      <defs>
        <linearGradient id={`${u}sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={orange} />
          <stop offset="1" stopColor={magenta} />
        </linearGradient>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night} />
          <stop offset="1" stopColor={magenta} stopOpacity={0.35} />
        </linearGradient>
        <filter id={`${u}glow`}>
          <feGaussianBlur stdDeviation={3} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={W} height={H} fill={night} />
      <rect width={W} height={290} fill={`url(#${u}sky)`} />
      <circle cx={200} cy={250} r={120} fill={`url(#${u}sun)`} />
      {range(6).map((i) => (
        <rect key={i} x={70} y={200 + i * 16} width={260} height={2 + i * 1.6} fill={night} />
      ))}
      <path d="M0 290 L70 220 L120 260 L180 200 L240 270 L300 230 L400 290 Z" fill={night} opacity={0.9} />
      <rect x={0} y={290} width={W} height={210} fill={night} />
      <g stroke={magenta} strokeWidth={1.5} filter={`url(#${u}glow)`}>
        {range(9).map((i) => {
          const y = 290 + Math.pow(i / 8, 2) * 210;
          return <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} />;
        })}
        {range(17).map((i) => (
          <line key={`v${i}`} x1={200} y1={290} x2={-600 + i * 100} y2={H} />
        ))}
      </g>
      <line x1={0} y1={290} x2={W} y2={290} stroke={cyan} strokeWidth={2} filter={`url(#${u}glow)`} />
    </>
  ),

  "italo-disco": ([space, pink, chrome, gold], u) => {
    const r = rng(11);
    return (
      <>
        <defs>
          <radialGradient id={`${u}ball`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={chrome} />
            <stop offset="1" stopColor={space} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={space} />
        {range(70).map((i) => (
          <circle key={i} cx={r() * W} cy={r() * H} r={r() * 1.4 + 0.3} fill="#FFFFFF" opacity={0.7} />
        ))}
        {range(7).map((i) => (
          <line key={i} x1={200} y1={520} x2={-40 + i * 80} y2={-20} stroke={i % 2 ? pink : chrome} strokeWidth={2} opacity={0.75} />
        ))}
        <circle cx={200} cy={220} r={96} fill={`url(#${u}ball)`} />
        {range(8).map((i) => (
          <ellipse key={i} cx={200} cy={220} rx={96} ry={96 - i * 12} fill="none" stroke={space} strokeWidth={0.6} opacity={0.5} />
        ))}
        {range(8).map((i) => (
          <ellipse key={`v${i}`} cx={200} cy={220} rx={96 - i * 12} ry={96} fill="none" stroke={space} strokeWidth={0.6} opacity={0.5} />
        ))}
        <path d={starPath(290, 150, 22, 3, 4)} fill="#FFFFFF" />
        <path d={starPath(120, 300, 14, 2, 4)} fill={gold} />
        <text x={200} y={420} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontWeight={700} fontSize={58} fill={pink} stroke={chrome} strokeWidth={1.5}>
          Notte
        </text>
      </>
    );
  },

  "future-funk": ([blush, pink, sky, lemon], u) => (
    <>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="1" stopColor={blush} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}s)`} />
      <circle cx={260} cy={190} r={90} fill={pink} />
      {[
        [20, 260, 50, 240],
        [80, 300, 40, 200],
        [130, 230, 60, 270],
        [200, 320, 36, 180],
        [245, 280, 55, 220],
        [310, 250, 45, 250],
        [360, 300, 40, 200],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={i % 2 ? "#FFFFFF" : sky} opacity={0.92} />
          {range(6).map((j) => (
            <rect key={j} x={(x as number) + 6} y={(y as number) + 10 + j * 18} width={(w as number) - 12} height={5} fill={pink} opacity={0.35} />
          ))}
        </g>
      ))}
      {[
        [80, 90],
        [340, 70],
        [150, 160],
      ].map(([x, y]) => (
        <path key={x} d={starPath(x!, y!, 16, 3, 4)} fill={lemon} />
      ))}
      {range(40).map((i) => (
        <rect key={i} x={0} y={i * 12.5} width={W} height={1.5} fill="#FFFFFF" opacity={0.18} />
      ))}
    </>
  ),

  vaporwave: ([pink, teal, violet, lav], u) => (
    <>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={violet} />
          <stop offset="0.6" stopColor={pink} />
          <stop offset="1" stopColor={lav} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}sky)`} />
      {range(10).map((row) =>
        range(12).map((col) => {
          const y0 = 330 + Math.pow(row / 10, 1.6) * 170;
          const y1 = 330 + Math.pow((row + 1) / 10, 1.6) * 170;
          const x = (c: number, y: number) => 200 + (c * 40 - 240) * ((y - 300) / 60);
          if ((row + col) % 2) return null;
          return <path key={`${row}-${col}`} d={`M${x(col, y0)} ${y0} L${x(col + 1, y0)} ${y0} L${x(col + 1, y1)} ${y1} L${x(col, y1)} ${y1} Z`} fill={teal} opacity={0.9} />;
        }),
      )}
      <path d="M160 330 C 150 290, 150 240, 170 210 C 150 190, 150 140, 190 120 C 240 100, 270 150, 255 190 C 262 200, 262 214, 252 218 L 256 240 C 262 250, 250 258, 244 262 C 250 290, 240 320, 230 330 Z" fill="#EDE6EE" stroke={violet} strokeWidth={1.5} />
      <rect x={176} y={170} width={70} height={10} fill={violet} />
      <g transform="translate(40 60)">
        <rect width={150} height={100} fill={lav} stroke="#222" />
        <rect width={150} height={16} fill={violet} />
        <rect x={134} y={3} width={11} height={10} fill={lav} stroke="#222" strokeWidth={0.6} />
        <rect x={12} y={30} width={100} height={6} fill={teal} />
        <rect x={12} y={44} width={70} height={6} fill={pink} />
      </g>
      <path d="M330 330 C 330 260, 340 210, 350 180 M350 180 c -30 -10 -50 5 -60 20 M350 180 c 20 -20 45 -15 55 0 M350 180 c -5 -25 5 -40 20 -45" fill="none" stroke="#2A2340" strokeWidth={5} strokeLinecap="round" />
    </>
  ),

  "gen-x-soft-club": ([frost, ice, twilight, silver], u) => (
    <>
      <defs>
        <filter id={`${u}blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
        <filter id={`${u}soft`}>
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
        <radialGradient id={`${u}cd`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.12" stopColor={frost} />
          <stop offset="0.13" stopColor={silver} />
          <stop offset="0.6" stopColor={frost} />
          <stop offset="0.8" stopColor={ice} />
          <stop offset="1" stopColor={silver} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={frost} />
      <circle cx={110} cy={130} r={120} fill={twilight} filter={`url(#${u}blur)`} opacity={0.7} />
      <circle cx={330} cy={400} r={140} fill={ice} filter={`url(#${u}blur)`} />
      <g filter={`url(#${u}soft)`}>
        <circle cx={240} cy={250} r={110} fill={`url(#${u}cd)`} />
        <circle cx={240} cy={250} r={14} fill={frost} stroke={silver} strokeWidth={2} />
        <path d="M170 190 A 90 90 0 0 1 310 200" fill="none" stroke="#FFFFFF" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
      </g>
      <rect x={40} y={420} width={150} height={1} fill={twilight} opacity={0.6} />
      <text x={40} y={446} fontFamily={sans} fontWeight={300} fontSize={15} letterSpacing={4} fill={twilight}>
        soft / club / 1999
      </text>
      <rect width={W} height={H} fill="#FFFFFF" opacity={0.12} />
    </>
  ),

  psychedelic: ([tangerine, purple, green, marigold]) => (
    <>
      <rect width={W} height={H} fill={purple} />
      {range(14).map((i) => (
        <path key={i} d={wavyRing(200, 250, 330 - i * 23, 12 - i * 0.4, 9, i * 0.6)} fill={[tangerine, purple, green, marigold][i % 4]} />
      ))}
      <circle cx={200} cy={250} r={20} fill={purple} />
      <text x={200} y={268} textAnchor="middle" fontFamily="'Cooper Black', Georgia, serif" fontWeight={900} fontSize={50} fill={marigold} stroke={purple} strokeWidth={3} transform="scale(1 1.2) translate(0 -42)">
        OHM
      </text>
    </>
  ),

  acid: ([black, green, chrome, uv], u) => (
    <>
      <defs>
        <linearGradient id={`${u}chr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor={chrome} />
          <stop offset="0.5" stopColor="#555" />
          <stop offset="0.75" stopColor={chrome} />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id={`${u}warp`}>
          <feTurbulence type="turbulence" baseFrequency="0.012 0.03" numOctaves={2} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={40} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={black} />
      <g fill="none" stroke={green} strokeWidth={1}>
        {range(9).map((i) => (
          <ellipse key={i} cx={200} cy={250} rx={170} ry={Math.abs(170 - i * 42.5)} />
        ))}
        {range(9).map((i) => (
          <ellipse key={`v${i}`} cx={200} cy={250} rx={Math.abs(170 - i * 42.5)} ry={170} />
        ))}
      </g>
      <text x={200} y={290} textAnchor="middle" fontFamily="Impact, 'Arial Black', sans-serif" fontSize={130} fill={`url(#${u}chr)`} filter={`url(#${u}warp)`} transform="scale(1 1.4) translate(0 -80)">
        ACID
      </text>
      <circle cx={330} cy={430} r={34} fill={green} />
      <circle cx={320} cy={422} r={4} fill={black} />
      <circle cx={340} cy={422} r={4} fill={black} />
      <path d="M314 440 Q 330 456 346 440" fill="none" stroke={black} strokeWidth={4} strokeLinecap="round" />
      <rect x={20} y={20} width={120} height={20} fill={uv} />
    </>
  ),

  kidcore: ([paper, red, yellow, blue], u) => {
    const r = rng(5);
    return (
      <>
        <rect width={W} height={H} fill={paper} />
        {[red, "#FF8A00", yellow, "#2DBE4E", blue].map((c, i) => (
          <path key={c} d={`M40 ${330} A ${160 - i * 24} ${160 - i * 24} 0 0 1 ${360 - i * 48} 330`} fill="none" stroke={c} strokeWidth={22} strokeLinecap="round" transform={`translate(${i * 24} 0)`} />
        ))}
        {["A", "B", "C"].map((ch, i) => (
          <g key={ch} transform={`translate(${60 + i * 100} ${370}) rotate(${(r() - 0.5) * 16})`}>
            <rect width={80} height={80} rx={6} fill={[red, yellow, blue][i]} stroke="#222" strokeWidth={3} />
            <text x={40} y={60} textAnchor="middle" fontFamily="'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif" fontWeight={900} fontSize={56} fill="#FFFFFF" stroke="#222" strokeWidth={2}>
              {ch}
            </text>
          </g>
        ))}
        {range(9).map((i) => (
          <path key={i} d={starPath(30 + r() * 340, 30 + r() * 120, 14, 6)} fill={[red, yellow, blue][i % 3]} stroke="#222" strokeWidth={2} strokeLinejoin="round" />
        ))}
        <Grain u={u} opacity={0.2} freq={0.7} />
      </>
    );
  },

  y2k: ([ice, aqua, chrome, pink], u) => (
    <>
      <defs>
        <radialGradient id={`${u}blob`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.4" stopColor={aqua} stopOpacity={0.75} />
          <stop offset="1" stopColor={aqua} stopOpacity={0.95} />
        </radialGradient>
        <linearGradient id={`${u}ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor={chrome} />
          <stop offset="0.55" stopColor="#6D7480" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id={`${u}iri`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={pink} />
          <stop offset="0.5" stopColor={aqua} stopOpacity={0.6} />
          <stop offset="1" stopColor="#D7B8FF" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={ice} />
      <rect x={0} y={330} width={W} height={170} fill={`url(#${u}iri)`} opacity={0.45} />
      <ellipse cx={200} cy={250} rx={170} ry={46} fill="none" stroke={`url(#${u}ring)`} strokeWidth={14} transform="rotate(-14 200 250)" />
      <path d="M130 170 C 160 90, 280 100, 290 180 C 300 250, 330 300, 270 340 C 210 380, 110 340, 110 270 C 110 230, 120 200, 130 170 Z" fill={`url(#${u}blob)`} />
      <path d="M160 160 C 180 130, 220 125, 240 140" fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.85} />
      {[
        [320, 110, 20],
        [80, 390, 14],
        [340, 380, 10],
      ].map(([x, y, s]) => (
        <path key={x} d={starPath(x!, y!, s!, s! / 6, 4)} fill={pink} />
      ))}
      <text x={40} y={460} fontFamily={sans} fontWeight={800} fontSize={30} letterSpacing={6} fill={chrome} stroke="#6D7480" strokeWidth={0.8} transform="scale(1.3 1)">
        2000
      </text>
    </>
  ),

  bubbleglam: ([candy, hot, lilac, champagne], u) => (
    <>
      <defs>
        {[hot, lilac, champagne].map((c, i) => (
          <radialGradient key={i} id={`${u}b${i}`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.35" stopColor={c} />
            <stop offset="1" stopColor={c} stopOpacity={0.85} />
          </radialGradient>
        ))}
      </defs>
      <rect width={W} height={H} fill={candy} />
      {[
        [130, 170, 90, 0],
        [270, 250, 110, 1],
        [150, 360, 70, 2],
        [300, 110, 44, 0],
        [70, 450, 30, 1],
        [330, 420, 56, 2],
      ].map(([x, y, r, g]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill={`url(#${u}b${g})`} />
      ))}
      {[
        [210, 80, 12],
        [360, 300, 16],
        [60, 280, 10],
        [230, 420, 14],
      ].map(([x, y, s]) => (
        <path key={x} d={starPath(x!, y!, s!, s! / 5, 4)} fill="#FFFFFF" />
      ))}
      <text x={200} y={275} textAnchor="middle" fontFamily="'Arial Rounded MT Bold', 'Comic Sans MS', sans-serif" fontWeight={900} fontSize={58} fill="#FFFFFF" stroke={hot} strokeWidth={6} paintOrder="stroke">
        glam
      </text>
    </>
  ),
};
