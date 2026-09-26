import { Grain, H, W, range, rng, starPath, type Renderer } from "../util";

const sans = "'Schibsted Grotesk Variable', Helvetica, Arial, sans-serif";
const mono = "'DM Mono', ui-monospace, monospace";

export const digitalStudies: Record<string, Renderer> = {
  "web-1-0": ([grey, link, navy, yellow], u) => (
    <>
      <defs>
        <pattern id={`${u}tile`} width={24} height={24} patternUnits="userSpaceOnUse">
          <rect width={24} height={24} fill="#1B7F3B" />
          <path d="M0 0 L12 12 L0 24 M24 0 L12 12 L24 24" stroke="#35B75C" strokeWidth={2} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}tile)`} />
      <rect x={30} y={60} width={340} height={380} fill={grey} stroke="#FFFFFF" strokeWidth={2} />
      <rect x={30} y={60} width={340} height={22} fill={navy} />
      <text x={38} y={76} fontFamily="Tahoma, Verdana, sans-serif" fontWeight={700} fontSize={12} fill="#FFFFFF">
        Welcome to my Homepage!!
      </text>
      <text x={200} y={130} textAnchor="middle" fontFamily="'Times New Roman', serif" fontSize={30} fill={navy}>
        My Cool Page
      </text>
      {["Links", "Guestbook", "About me", "Webring"].map((t, i) => (
        <g key={t}>
          <text x={60} y={180 + i * 30} fontFamily="'Times New Roman', serif" fontSize={18} fill={link} textDecoration="underline">
            {t}
          </text>
          <line x1={60} y1={183 + i * 30} x2={60 + t.length * 8.4} y2={183 + i * 30} stroke={link} />
        </g>
      ))}
      <path d={starPath(290, 210, 50, 32, 14)} fill={yellow} stroke="#D00" strokeWidth={2} />
      <text x={290} y={218} textAnchor="middle" fontFamily="'Comic Sans MS', sans-serif" fontWeight={700} fontSize={22} fill="#D00">
        NEW!
      </text>
      <rect x={60} y={320} width={120} height={36} fill={grey} stroke="#FFF" strokeWidth={2} />
      <path d="M60 356 H180 V320" fill="none" stroke="#555" strokeWidth={2} />
      <text x={120} y={343} textAnchor="middle" fontFamily="Tahoma, sans-serif" fontSize={13} fill="#000">
        Click here
      </text>
      <rect x={220} y={326} width={120} height={24} fill="#000" />
      <text x={280} y={343} textAnchor="middle" fontFamily={mono} fontSize={14} fill="#39FF14">
        0004217
      </text>
      <rect x={60} y={380} width={280} height={40} fill={yellow} />
      {range(14).map((i) => (
        <path key={i} d={`M${64 + i * 20} 416 l10 -32 l10 32`} fill="none" stroke="#000" strokeWidth={3} />
      ))}
    </>
  ),

  "web-2-0-gloss": ([white, blue, lime, tangerine], u) => {
    const pills: [number, number, string, string][] = [
      [70, 140, blue, "Sign up"],
      [70, 230, lime, "Beta"],
      [70, 320, tangerine, "Share"],
    ];
    return (
      <>
        <defs>
          <linearGradient id={`${u}gl`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id={`${u}fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={white} stopOpacity={0.3} />
            <stop offset="0.7" stopColor={white} stopOpacity={1} />
          </linearGradient>
          <filter id={`${u}sh`}>
            <feDropShadow dx={0} dy={4} stdDeviation={4} floodOpacity={0.2} />
          </filter>
        </defs>
        <rect width={W} height={H} fill={white} />
        {pills.map(([x, y, c, t]) => (
          <g key={t} filter={`url(#${u}sh)`}>
            <rect x={x} y={y} width={260} height={64} rx={32} fill={c} />
            <rect x={x + 8} y={y + 4} width={244} height={28} rx={14} fill={`url(#${u}gl)`} />
            <text x={x + 130} y={y + 42} textAnchor="middle" fontFamily="'Trebuchet MS', 'Lucida Grande', sans-serif" fontWeight={700} fontSize={24} fill="#FFFFFF">
              {t}
            </text>
          </g>
        ))}
        <g transform="translate(0 810) scale(1 -1)">
          <rect x={70} y={320} width={260} height={64} rx={32} fill={tangerine} opacity={0.5} />
        </g>
        <rect x={0} y={400} width={W} height={100} fill={`url(#${u}fade)`} />
        <path d={starPath(330, 110, 44, 34, 16)} fill={lime} />
        <text x={330} y={116} textAnchor="middle" fontFamily="'Trebuchet MS', sans-serif" fontWeight={700} fontSize={15} fill="#FFFFFF" transform="rotate(-14 330 110)">
          FREE!
        </text>
      </>
    );
  },

  skeuomorphism: ([leather, notepad, steel, shadow], u) => (
    <>
      <defs>
        <filter id={`${u}lth`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.35} numOctaves={3} seed={9} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.35} />
          </feComponentTransfer>
        </filter>
        <radialGradient id={`${u}knob`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor={steel} />
          <stop offset="1" stopColor="#5E6268" />
        </radialGradient>
        <filter id={`${u}sh`}>
          <feDropShadow dx={0} dy={6} stdDeviation={6} floodColor={shadow} floodOpacity={0.6} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={leather} />
      <rect width={W} height={H} filter={`url(#${u}lth)`} style={{ mixBlendMode: "multiply" }} />
      <rect x={16} y={16} width={368} height={468} rx={12} fill="none" stroke="#E7D3B5" strokeWidth={2} strokeDasharray="8 6" opacity={0.7} />
      <g filter={`url(#${u}sh)`}>
        <rect x={60} y={60} width={200} height={250} fill={notepad} />
        {range(9).map((i) => (
          <line key={i} x1={60} y1={100 + i * 22} x2={260} y2={100 + i * 22} stroke="#9FB8D0" strokeWidth={1} />
        ))}
        <line x1={90} y1={60} x2={90} y2={310} stroke="#D98B8B" strokeWidth={1.2} />
        <text x={100} y={117} fontFamily="'Marker Felt', 'Comic Sans MS', cursive" fontSize={17} fill="#2B3A55">
          buy milk
        </text>
      </g>
      <g filter={`url(#${u}sh)`}>
        <circle cx={290} cy={380} r={64} fill={`url(#${u}knob)`} />
        {range(36).map((i) => {
          const a = (i / 36) * Math.PI * 2;
          return <line key={i} x1={290 + Math.cos(a) * 58} y1={380 + Math.sin(a) * 58} x2={290 + Math.cos(a) * 64} y2={380 + Math.sin(a) * 64} stroke="#50545A" strokeWidth={1.2} />;
        })}
        <line x1={290} y1={380} x2={320} y2={346} stroke="#2A2A2A" strokeWidth={4} strokeLinecap="round" />
      </g>
      <rect x={60} y={400} width={120} height={40} rx={20} fill="#2A2A2A" />
      <circle cx={158} cy={420} r={16} fill={`url(#${u}knob)`} />
    </>
  ),

  neumorphism: ([soft, highlight, shadow, slate], u) => (
    <>
      <defs>
        <filter id={`${u}out`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx={-12} dy={-12} stdDeviation={10} floodColor={highlight} floodOpacity={1} />
          <feDropShadow dx={12} dy={12} stdDeviation={12} floodColor={shadow} floodOpacity={1} />
        </filter>
        <linearGradient id={`${u}in`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shadow} stopOpacity={0.55} />
          <stop offset="1" stopColor={highlight} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={soft} />
      <circle cx={200} cy={190} r={90} fill={soft} filter={`url(#${u}out)`} />
      <circle cx={200} cy={190} r={56} fill={`url(#${u}in)`} />
      <circle cx={200} cy={190} r={50} fill={soft} />
      <rect x={80} y={340} width={240} height={56} rx={28} fill={soft} filter={`url(#${u}out)`} />
      <rect x={96} y={356} width={120} height={24} rx={12} fill={slate} opacity={0.25} />
      <circle cx={290} cy={368} r={14} fill={slate} opacity={0.5} />
      <rect x={80} y={430} width={100} height={36} rx={18} fill={soft} filter={`url(#${u}out)`} />
      <rect x={220} y={430} width={100} height={36} rx={18} fill={`url(#${u}in)`} />
    </>
  ),

  glassmorphism: ([indigo, violet, rose, frost], u) => (
    <>
      <defs>
        <filter id={`${u}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
        <clipPath id={`${u}clip`}>
          <rect x={60} y={140} width={280} height={220} rx={22} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={indigo} />
      <circle cx={120} cy={160} r={100} fill={violet} />
      <circle cx={300} cy={360} r={110} fill={rose} />
      <circle cx={320} cy={120} r={40} fill={frost} opacity={0.6} />
      <g clipPath={`url(#${u}clip)`}>
        <g filter={`url(#${u}b)`}>
          <circle cx={120} cy={160} r={100} fill={violet} />
          <circle cx={300} cy={360} r={110} fill={rose} />
        </g>
      </g>
      <rect x={60} y={140} width={280} height={220} rx={22} fill={frost} opacity={0.18} stroke={frost} strokeOpacity={0.6} strokeWidth={1.5} />
      <rect x={88} y={170} width={46} height={46} rx={23} fill={frost} opacity={0.5} />
      <rect x={150} y={180} width={150} height={10} rx={5} fill={frost} opacity={0.7} />
      <rect x={150} y={200} width={100} height={8} rx={4} fill={frost} opacity={0.45} />
      <text x={88} y={320} fontFamily={sans} fontWeight={600} fontSize={40} fill={frost}>
        24°
      </text>
    </>
  ),

  neubrutalism: ([cream, black, red, cyan]) => (
    <>
      <rect width={W} height={H} fill={cream} />
      {(
        [
          [40, 50, 230, 150, red],
          [150, 230, 210, 110, cyan],
          [40, 370, 150, 90, "#FFD84D"],
        ] as const
      ).map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={x + 10} y={y + 10} width={w} height={h} fill={black} />
          <rect x={x} y={y} width={w} height={h} fill={c} stroke={black} strokeWidth={4} />
        </g>
      ))}
      <text x={56} y={148} fontFamily={sans} fontWeight={900} fontSize={70} fill={black} letterSpacing={-3}>
        LOUD
      </text>
      <text x={170} y={300} fontFamily={mono} fontSize={26} fill={black}>
        {"click_me()"}
      </text>
      <circle cx={320} cy={420} r={40} fill={cream} stroke={black} strokeWidth={4} />
      <path d="M305 420 h30 M322 406 l14 14 l-14 14" fill="none" stroke={black} strokeWidth={4} />
    </>
  ),

  cyberpop: ([white, pink, cyan, lime], u) => (
    <>
      <defs>
        <linearGradient id={`${u}holo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pink} />
          <stop offset="0.5" stopColor={cyan} />
          <stop offset="1" stopColor={lime} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={white} />
      {range(20).map((i) => (
        <line key={i} x1={0} y1={i * 25} x2={W} y2={i * 25} stroke={cyan} strokeWidth={0.5} opacity={0.4} />
      ))}
      {(
        [
          [30, 60, 220, 150, pink],
          [150, 180, 220, 170, cyan],
          [50, 330, 170, 120, lime],
        ] as const
      ).map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={white} stroke="#1A1A2E" strokeWidth={2.5} />
          <rect x={x} y={y} width={w} height={20} fill={c} stroke="#1A1A2E" strokeWidth={2.5} />
          <circle cx={x + w - 12} cy={y + 10} r={4} fill="#1A1A2E" />
        </g>
      ))}
      <circle cx={260} cy={265} r={48} fill={`url(#${u}holo)`} stroke="#1A1A2E" strokeWidth={2.5} />
      <path d={starPath(110, 160, 36, 14, 5)} fill={`url(#${u}holo)`} stroke="#1A1A2E" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={starPath(330, 420, 28, 5, 4)} fill={pink} />
      <path d="M270 380 L270 420 L280 410 L288 428 L294 425 L286 408 L300 408 Z" fill="#FFFFFF" stroke="#1A1A2E" strokeWidth={2} />
      <text x={70} y={410} fontFamily={sans} fontWeight={900} fontSize={30} fill="#1A1A2E">
        :-) ♥
      </text>
    </>
  ),

  chromecore: ([black, highlight, mid, sky], u) => (
    <>
      <defs>
        <linearGradient id={`${u}c`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={highlight} />
          <stop offset="0.3" stopColor={sky} />
          <stop offset="0.48" stopColor={highlight} />
          <stop offset="0.52" stopColor="#1B1D22" />
          <stop offset="0.7" stopColor={mid} />
          <stop offset="1" stopColor={highlight} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={black} />
      <path d="M200 60 C 300 60, 340 150, 300 220 C 270 270, 360 320, 320 400 C 280 470, 160 470, 110 410 C 60 350, 140 300, 110 240 C 80 170, 110 60, 200 60 Z" fill={`url(#${u}c)`} />
      <path d="M170 100 C 210 90, 250 100, 270 130" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.9} />
      <ellipse cx={220} cy={470} rx={120} ry={10} fill={sky} opacity={0.15} />
      {range(5).map((i) => (
        <circle key={i} cx={80 + i * 60} cy={40 + (i % 2) * 20} r={3 + (i % 3)} fill={`url(#${u}c)`} />
      ))}
    </>
  ),

  cyberpunk: ([night, cyan, magenta, amber], u) => {
    const r = rng(21);
    return (
      <>
        <defs>
          <filter id={`${u}g`}>
            <feGaussianBlur stdDeviation={4} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`${u}haze`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={night} />
            <stop offset="1" stopColor={magenta} stopOpacity={0.25} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${u}haze)`} />
        {[
          [0, 60, 110],
          [90, 20, 90],
          [170, 110, 80],
          [240, 0, 100],
          [330, 80, 70],
        ].map(([x, y, w], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={H} fill="#0E1220" stroke="#1D2438" />
            {range(28).map((j) =>
              r() > 0.62 ? <rect key={j} x={x! + 8 + (j % 4) * ((w! - 16) / 4)} y={y! + 16 + Math.floor(j / 4) * 26} width={8} height={10} fill={r() > 0.5 ? amber : cyan} opacity={0.55} /> : null,
            )}
          </g>
        ))}
        <g filter={`url(#${u}g)`}>
          <rect x={30} y={180} width={24} height={150} fill="none" stroke={magenta} strokeWidth={3} />
          <text x={42} y={200} textAnchor="middle" fontFamily="sans-serif" fontWeight={700} fontSize={20} fill={magenta} style={{ writingMode: "vertical-rl" }}>
            夜市
          </text>
          <rect x={200} y={260} width={120} height={40} fill="none" stroke={cyan} strokeWidth={3} />
          <text x={260} y={287} textAnchor="middle" fontFamily={mono} fontSize={18} fill={cyan}>
            OPEN 24
          </text>
          <line x1={250} y1={140} x2={340} y2={140} stroke={amber} strokeWidth={4} />
        </g>
        {range(60).map((i) => {
          const x = r() * W;
          const y = r() * H;
          return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 26} stroke="#9FD8FF" strokeWidth={0.8} opacity={0.35} />;
        })}
        <rect x={0} y={440} width={W} height={60} fill={night} opacity={0.8} />
        <rect x={40} y={450} width={120} height={4} fill={magenta} opacity={0.6} filter={`url(#${u}g)`} />
        <rect x={220} y={462} width={140} height={4} fill={cyan} opacity={0.6} filter={`url(#${u}g)`} />
      </>
    );
  },

  cyberminimalism: ([carbon, white, graphite, cyan]) => (
    <>
      <rect width={W} height={H} fill={carbon} />
      {range(9).map((i) => (
        <line key={i} x1={40 + i * 40} y1={40} x2={40 + i * 40} y2={460} stroke={graphite} strokeWidth={0.4} />
      ))}
      <circle cx={200} cy={220} r={120} fill="none" stroke={white} strokeWidth={0.8} />
      <circle cx={200} cy={220} r={80} fill="none" stroke={graphite} strokeWidth={0.8} strokeDasharray="1 5" />
      {range(60).map((i) => {
        const a = (i / 60) * Math.PI * 2;
        const l = i % 5 ? 4 : 10;
        return <line key={i} x1={200 + Math.cos(a) * 120} y1={220 + Math.sin(a) * 120} x2={200 + Math.cos(a) * (120 + l)} y2={220 + Math.sin(a) * (120 + l)} stroke={white} strokeWidth={0.8} />;
      })}
      <line x1={200} y1={220} x2={290} y2={140} stroke={cyan} strokeWidth={1.2} />
      <circle cx={290} cy={140} r={4} fill={cyan} />
      <text x={298} y={132} fontFamily={mono} fontSize={10} fill={cyan}>
        41.7°
      </text>
      <text x={40} y={410} fontFamily={mono} fontSize={10} fill={white} opacity={0.8}>
        SYS / 00:14:02
      </text>
      <rect x={40} y={420} width={200} height={1} fill={white} />
      <rect x={40} y={420} width={74} height={1} fill={cyan} />
      <text x={40} y={446} fontFamily={sans} fontWeight={200} fontSize={20} letterSpacing={8} fill={white}>
        NULL
      </text>
    </>
  ),

  glitch: ([black, red, cyan, white]) => {
    const r = rng(33);
    const bands = range(14).map((i) => ({ y: 80 + i * 24, dx: (r() - 0.5) * 60, h: 10 + r() * 14 }));
    const shape = (fill: string, dx: number) => (
      <g transform={`translate(${dx} 0)`} style={{ mixBlendMode: "screen" }}>
        <circle cx={200} cy={250} r={120} fill={fill} />
        <rect x={140} y={200} width={120} height={20} fill={black} />
      </g>
    );
    return (
      <>
        <rect width={W} height={H} fill={black} />
        {shape(red, -10)}
        {shape(cyan, 10)}
        {bands.map((b, i) => (
          <g key={i}>
            <rect x={0} y={b.y} width={W} height={b.h} fill={black} />
            <rect x={80 + b.dx} y={b.y} width={240} height={b.h} fill={i % 3 === 0 ? white : i % 3 === 1 ? red : cyan} opacity={0.85} />
          </g>
        ))}
        {range(125).map((i) => (
          <rect key={i} x={0} y={i * 4} width={W} height={1} fill={black} opacity={0.45} />
        ))}
        {range(12).map((i) => (
          <rect key={`p${i}`} x={r() * W} y={r() * H} width={10 + r() * 50} height={6} fill={i % 2 ? cyan : red} />
        ))}
      </>
    );
  },

  "pixel-art": ([night, sky, grass, sand]) => {
    const px = 20;
    const cells: [number, number, string][] = [];
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 20; x++) {
        let c = y < 10 ? sky : y < 13 ? "#8FD3FF" : sky;
        const hill = 15 + Math.round(Math.sin(x * 0.55) * 2);
        if (y >= hill) c = grass;
        if (y >= 21) c = sand;
        if (y >= 23) c = night;
        cells.push([x, y, c]);
      }
    }
    const sun: [number, number][] = [
      [15, 3], [16, 3], [14, 4], [15, 4], [16, 4], [17, 4], [14, 5], [15, 5], [16, 5], [17, 5], [15, 6], [16, 6],
    ];
    const hero: [number, number, string][] = [
      [5, 17, "#F24E4E"], [6, 17, "#F24E4E"], [5, 18, "#FFCD75"], [6, 18, "#FFCD75"], [5, 19, night], [6, 19, night], [4, 19, "#F24E4E"], [7, 19, "#F24E4E"], [5, 20, "#3B5DC9"], [6, 20, "#3B5DC9"],
    ];
    return (
      <>
        {cells.map(([x, y, c]) => (
          <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={c} />
        ))}
        {sun.map(([x, y]) => (
          <rect key={`s${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill="#FFE066" />
        ))}
        {[
          [2, 4], [3, 4], [4, 4], [3, 3], [9, 6], [10, 6], [11, 6], [10, 5],
        ].map(([x, y]) => (
          <rect key={`c${x}-${y}`} x={x! * px} y={y! * px} width={px} height={px} fill="#FFFFFF" />
        ))}
        {hero.map(([x, y, c]) => (
          <rect key={`h${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={c} />
        ))}
        {range(10).map((i) => (
          <rect key={`d${i}`} x={(i * 2 + (i % 2)) * px} y={22 * px} width={px / 2} height={px / 2} fill={grass} />
        ))}
      </>
    );
  },

  aurora: ([polar, green, violet, blue], u) => (
    <>
      <defs>
        <filter id={`${u}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={40} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={polar} />
      <g filter={`url(#${u}b)`}>
        <ellipse cx={120} cy={170} rx={160} ry={60} fill={green} transform="rotate(-25 120 170)" opacity={0.9} />
        <ellipse cx={290} cy={250} rx={150} ry={70} fill={violet} transform="rotate(-35 290 250)" />
        <ellipse cx={200} cy={380} rx={180} ry={50} fill={blue} opacity={0.8} />
        <ellipse cx={300} cy={110} rx={80} ry={40} fill={green} opacity={0.6} />
      </g>
      <path d="M0 440 L60 400 L110 425 L170 380 L230 420 L300 390 L400 430 V500 H0 Z" fill={polar} />
      <Grain u={u} opacity={0.16} />
    </>
  ),

  surveillance: ([dark, green, grey, red], u) => (
    <>
      <defs>
        <radialGradient id={`${u}v`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.7} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={dark} />
      <path d="M-40 500 L140 180 L260 180 L440 500 Z" fill={green} opacity={0.35} />
      <path d="M140 180 L260 180 L260 60 L140 60 Z" fill={green} opacity={0.2} />
      {range(6).map((i) => (
        <line key={i} x1={140 - i * 30} y1={180 + i * 54} x2={260 + i * 30} y2={180 + i * 54} stroke={grey} strokeWidth={0.8} opacity={0.4} />
      ))}
      <line x1={140} y1={180} x2={-40} y2={500} stroke={grey} opacity={0.5} />
      <line x1={260} y1={180} x2={440} y2={500} stroke={grey} opacity={0.5} />
      <rect x={150} y={70} width={100} height={12} fill={grey} opacity={0.8} />
      <ellipse cx={230} cy={390} rx={22} ry={8} fill="#000" opacity={0.4} />
      <circle cx={226} cy={300} r={12} fill={grey} opacity={0.85} />
      <path d="M212 314 L240 314 L246 388 L208 388 Z" fill={grey} opacity={0.8} />
      <rect width={W} height={H} fill={`url(#${u}v)`} />
      {range(100).map((i) => (
        <rect key={i} x={0} y={i * 5} width={W} height={1.5} fill="#000" opacity={0.25} />
      ))}
      <circle cx={30} cy={34} r={7} fill={red} />
      <text x={44} y={39} fontFamily={mono} fontSize={14} fill={grey}>
        REC
      </text>
      <text x={20} y={478} fontFamily={mono} fontSize={13} fill={grey}>
        CAM 03 · 2026-09-26 03:14:07
      </text>
      <Grain u={u} opacity={0.4} freq={1.3} />
    </>
  ),

  futuristic: ([ceramic, titanium, space, panel], u) => (
    <>
      <defs>
        <radialGradient id={`${u}sph`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.7" stopColor={ceramic} />
          <stop offset="1" stopColor={titanium} />
        </radialGradient>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={space} />
          <stop offset="1" stopColor={titanium} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}sky)`} />
      <path d="M270 400 L300 40 L330 400 Z" fill={ceramic} />
      <path d="M300 40 L330 400 L300 400 Z" fill={titanium} opacity={0.5} />
      <circle cx={170} cy={300} r={120} fill={`url(#${u}sph)`} />
      <path d="M50 300 A 120 30 0 0 0 290 300" fill="none" stroke={panel} strokeWidth={3} />
      <rect x={0} y={400} width={W} height={100} fill={ceramic} />
      <path d="M0 400 H400" stroke={panel} strokeWidth={3} />
      <rect x={196} y={372} width={4} height={14} fill={space} />
      <circle cx={198} cy={368} r={3} fill={space} />
      {range(8).map((i) => (
        <rect key={i} x={20 + i * 48} y={440} width={30} height={3} fill={panel} opacity={0.7} />
      ))}
    </>
  ),
};
