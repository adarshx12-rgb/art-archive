import { Grain, H, W, range, rng, starPath, tornRect, type Renderer } from "../util";

const sans = "'Schibsted Grotesk Variable', Helvetica, Arial, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";
const mono = "'DM Mono', ui-monospace, monospace";

export const printStudies: Record<string, Renderer> = {
  "experimental-type": ([bg, ink, blue, orange]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <text x={-30} y={330} fontFamily={sans} fontWeight={900} fontSize={420} fill={blue} transform="scale(1 1.35)" style={{ mixBlendMode: "multiply" }} letterSpacing={-40}>
        A
      </text>
      <text x={150} y={500} fontFamily={sans} fontWeight={900} fontSize={330} fill={orange} style={{ mixBlendMode: "multiply" }} transform="rotate(-8 200 400)">
        r
      </text>
      <text x={20} y={120} fontFamily={serif} fontStyle="italic" fontSize={92} fill={ink} transform="scale(1.8 0.7)">
        type
      </text>
      {range(8).map((i) => (
        <text key={i} x={380} y={60 + i * 54} textAnchor="end" fontFamily={mono} fontSize={10} fill={ink}>
          {`${i}/8: reading is optional`}
        </text>
      ))}
    </>
  ),

  "80s-editorial": ([bg, magenta, black, cyan]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={0} y={0} width={260} height={H} fill={magenta} />
      <rect x={260} y={300} width={140} height={200} fill={cyan} />
      <ellipse cx={176} cy={196} rx={62} ry={76} fill={black} opacity={0.35} transform="translate(22 14)" />
      <path d="M60 500 C 70 360, 120 320, 176 320 C 240 320, 290 360, 300 500 Z" fill={black} opacity={0.35} transform="translate(22 0)" />
      <path d="M60 500 C 70 360, 120 320, 176 320 C 240 320, 290 360, 300 500 Z" fill="#F4F0E8" />
      <path d="M60 500 L110 360 L176 330 L242 360 L300 500 Z" fill={black} opacity={0.9} />
      <ellipse cx={176} cy={196} rx={62} ry={76} fill="#E8C3A8" />
      <path d="M114 180 C 110 100, 250 90, 240 190 C 230 140, 150 130, 114 180 Z" fill={black} />
      <circle cx={122} cy={230} r={12} fill={cyan} stroke={black} strokeWidth={2} />
      <text x={392} y={70} textAnchor="end" fontFamily={sans} fontWeight={900} fontSize={54} fill={black} letterSpacing={-2}>
        NOW
      </text>
      <text x={392} y={120} textAnchor="end" fontFamily={sans} fontWeight={900} fontSize={54} fill={magenta} letterSpacing={-2}>
        LOUD
      </text>
      <text x={392} y={150} textAnchor="end" fontFamily={sans} fontStyle="italic" fontSize={16} fill={black}>
        the style issue
      </text>
    </>
  ),

  editorial: ([bg, ink, oat, walnut], u) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={40} y={40} width={320} height={270} fill={oat} />
      <ellipse cx={250} cy={276} rx={120} ry={10} fill={walnut} opacity={0.25} />
      <path d="M150 280 C 120 230, 130 170, 170 160 L 170 130 L 190 130 L 190 160 C 230 170, 240 230, 210 280 Z" fill={walnut} />
      <rect x={236} y={200} width={70} height={80} fill={bg} />
      <circle cx={271} cy={200} r={35} fill={bg} />
      <rect x={40} y={40} width={320} height={270} fill={`url(#${u}light)`} />
      <defs>
        <linearGradient id={`${u}light`} x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.12} />
        </linearGradient>
      </defs>
      <text x={40} y={372} fontFamily={serif} fontSize={40} fill={ink}>
        Quiet objects,
      </text>
      <text x={40} y={412} fontFamily={serif} fontStyle="italic" fontSize={40} fill={ink}>
        slow light
      </text>
      {range(4).map((i) => (
        <rect key={i} x={40} y={440 + i * 10} width={i === 3 ? 90 : 150} height={3} fill={ink} opacity={0.5} />
      ))}
      {range(4).map((i) => (
        <rect key={i} x={210} y={440 + i * 10} width={i === 3 ? 60 : 150} height={3} fill={ink} opacity={0.5} />
      ))}
      <Grain u={u} opacity={0.1} />
    </>
  ),

  "type-doodles": ([paper, ink, coral, sky]) => (
    <>
      <rect width={W} height={H} fill={paper} />
      {range(24).map((i) => (
        <line key={i} x1={0} y1={40 + i * 20} x2={W} y2={40 + i * 20} stroke={sky} strokeWidth={0.8} opacity={0.5} />
      ))}
      <line x1={50} y1={0} x2={50} y2={H} stroke={coral} strokeWidth={1} opacity={0.6} />
      <text x={206} y={276} textAnchor="middle" fontFamily="'Comic Sans MS', 'Marker Felt', cursive" fontWeight={900} fontSize={120} fill={coral} stroke={ink} strokeWidth={4} transform="rotate(-6 200 250)">
        hey!
      </text>
      <text x={200} y={270} textAnchor="middle" fontFamily="'Comic Sans MS', 'Marker Felt', cursive" fontWeight={900} fontSize={120} fill="none" stroke={ink} strokeWidth={2} transform="rotate(-6 200 250)">
        hey!
      </text>
      <path d={starPath(80, 110, 26, 11)} fill={sky} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <path d={starPath(330, 390, 20, 8)} fill="none" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M90 380 C 130 420, 200 430, 250 390 M 238 378 L 252 390 L 236 400" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M80 320 q 15 12 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <circle cx={320} cy={110} r={34} fill="none" stroke={coral} strokeWidth={4} />
      <circle cx={308} cy={104} r={4} fill={ink} />
      <circle cx={330} cy={104} r={4} fill={ink} />
      <path d="M306 120 Q 320 132 334 120" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M160 450 l 8 -14 l 8 14 l 8 -14 l 8 14" fill="none" stroke={coral} strokeWidth={3} />
    </>
  ),

  handwritten: ([paper, blue, sepia, kraft], u) => (
    <>
      <rect width={W} height={H} fill={paper} />
      <rect x={260} y={0} width={140} height={H} fill={kraft} opacity={0.35} />
      {range(6).map((i) => {
        const y = 110 + i * 56;
        const r = rng(i + 3);
        let d = `M50 ${y}`;
        let x = 50;
        while (x < 330 - i * 12) {
          const w = 12 + r() * 14;
          d += ` c ${w * 0.3} ${-18 - r() * 12}, ${w * 0.7} ${-18 - r() * 12}, ${w * 0.5} 0 s ${w * 0.3} 12, ${w * 0.5} 4`;
          x += w;
          if (r() > 0.8) {
            x += 14;
            d += ` m 14 0`;
          }
        }
        return <path key={i} d={d} fill="none" stroke={i === 5 ? sepia : blue} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />;
      })}
      <path d="M60 60 c 20 -40, 40 30, 60 -8 s 30 10, 50 -10" fill="none" stroke={blue} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={320} cy={440} rx={16} ry={11} fill={blue} opacity={0.75} />
      <circle cx={344} cy={452} r={4} fill={blue} opacity={0.6} />
      <Grain u={u} opacity={0.12} />
    </>
  ),

  "tech-spec": ([bg, ink, orange, alu]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={110} y={120} width={180} height={240} rx={34} fill={alu} />
      <rect x={126} y={136} width={148} height={148} rx={20} fill={ink} />
      <circle cx={200} cy={210} r={44} fill="none" stroke={alu} strokeWidth={2} />
      <circle cx={200} cy={210} r={8} fill={orange} />
      <rect x={170} y={310} width={60} height={24} rx={12} fill={ink} />
      {[
        [200, 210, 340, 90, "01"],
        [290, 250, 350, 250, "02"],
        [200, 322, 330, 400, "03"],
        [110, 180, 50, 140, "04"],
      ].map(([x1, y1, x2, y2, n]) => (
        <g key={n as string}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={1} />
          <circle cx={x1 as number} cy={y1 as number} r={3} fill={ink} />
          <circle cx={x2 as number} cy={y2 as number} r={12} fill={bg} stroke={ink} />
          <text x={x2 as number} y={(y2 as number) + 4} textAnchor="middle" fontFamily={mono} fontSize={10} fill={ink}>
            {n}
          </text>
        </g>
      ))}
      <line x1={110} y1={390} x2={290} y2={390} stroke={ink} />
      <path d="M110 385 v10 M290 385 v10" stroke={ink} />
      <text x={200} y={408} textAnchor="middle" fontFamily={mono} fontSize={10} fill={ink}>
        72.0 mm
      </text>
      <rect x={30} y={430} width={110} height={40} fill={orange} />
      <text x={38} y={454} fontFamily={mono} fontSize={11} fill={ink}>
        FF-0420 / R2
      </text>
      {range(26).map((i) => (
        <rect key={i} x={250 + i * 4.5} y={436} width={i % 3 ? 1.5 : 3} height={30} fill={ink} />
      ))}
      <text x={30} y={40} fontFamily={mono} fontSize={10} fill={ink}>
        UNIT A / SPEC SHEET / REV 2
      </text>
    </>
  ),

  blueprint: ([blue, chalk, faded, deep], u) => (
    <>
      <rect width={W} height={H} fill={blue} />
      {range(21).map((i) => (
        <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={H} stroke={faded} strokeWidth={i % 5 ? 0.4 : 0.9} />
      ))}
      {range(26).map((i) => (
        <line key={`h${i}`} x1={0} y1={i * 20} x2={W} y2={i * 20} stroke={faded} strokeWidth={i % 5 ? 0.4 : 0.9} />
      ))}
      <g fill="none" stroke={chalk} strokeWidth={1.6}>
        <circle cx={200} cy={200} r={110} />
        <circle cx={200} cy={200} r={70} strokeDasharray="6 4" />
        <circle cx={200} cy={200} r={20} />
        {range(8).map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={200 + Math.cos(a) * 20} y1={200 + Math.sin(a) * 20} x2={200 + Math.cos(a) * 110} y2={200 + Math.sin(a) * 110} />;
        })}
        <line x1={60} y1={200} x2={340} y2={200} strokeDasharray="14 4 2 4" strokeWidth={0.8} />
        <rect x={90} y={360} width={220} height={60} />
        <line x1={90} y1={440} x2={310} y2={440} strokeWidth={0.8} />
        <path d="M90 434 v12 M310 434 v12 M96 440 l-6 -3 v6 z M304 440 l6 -3 v6 z" />
      </g>
      <text x={200} y={456} textAnchor="middle" fontFamily={mono} fontSize={10} fill={chalk}>
        Ø 220 / SECTION A-A
      </text>
      <rect x={250} y={466} width={140} height={26} fill="none" stroke={chalk} strokeWidth={0.8} />
      <text x={258} y={483} fontFamily={mono} fontSize={9} fill={chalk}>
        DWG 07 · SCALE 1:4
      </text>
      <rect width={W} height={H} fill={deep} opacity={0.12} />
      <Grain u={u} opacity={0.2} />
    </>
  ),

  "collage-art": ([kraft, navy, yellow, brick], u) => (
    <>
      <defs>
        <filter id={`${u}sh`}>
          <feDropShadow dx={2} dy={3} stdDeviation={2} floodOpacity={0.3} />
        </filter>
        <pattern id={`${u}ht`} width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={3} cy={3} r={1.3} fill="#1A1A1A" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={kraft} />
      <g filter={`url(#${u}sh)`}>
        <path d={tornRect(-10, 150, 250, 300, 1, 14)} fill={navy} />
        <path d={tornRect(180, 60, 170, 200, 2)} fill="#E9E1D0" />
        <path d={tornRect(200, 80, 130, 160, 3)} fill={`url(#${u}ht)`} opacity={0.6} />
        <path d={tornRect(150, 250, 120, 200, 4, 10)} fill={yellow} transform="rotate(4 210 350)" />
        <path d={tornRect(60, 60, 110, 60, 5)} fill={brick} transform="rotate(-6 110 90)" />
        <path d={tornRect(250, 380, 130, 90, 6)} fill="#D9D4C7" transform="rotate(-3 310 420)" />
      </g>
      <text x={120} y={440} fontFamily={serif} fontWeight={700} fontSize={96} fill="#141414">
        ma
      </text>
      <text x={262} y={420} fontFamily={mono} fontSize={11} fill={brick}>
        No. 16063
      </text>
      <Grain u={u} opacity={0.2} />
    </>
  ),

  grunge: ([soot, olive, rust, cream], u) => (
    <>
      <defs>
        <filter id={`${u}rough`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.04} numOctaves={3} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={16} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={soot} />
      <g filter={`url(#${u}rough)`}>
        <rect x={40} y={60} width={230} height={290} fill={olive} transform="rotate(-4 155 205)" />
        <rect x={150} y={250} width={220} height={180} fill={cream} opacity={0.85} transform="rotate(3 260 340)" />
        <circle cx={120} cy={420} r={40} fill={rust} opacity={0.6} />
      </g>
      <rect x={250} y={40} width={110} height={26} fill={cream} opacity={0.55} transform="rotate(8 305 53)" />
      <text x={170} y={330} fontFamily="'Courier New', monospace" fontWeight={700} fontSize={36} fill={soot}>
        static
      </text>
      <text x={170} y={366} fontFamily="'Courier New', monospace" fontSize={18} fill={rust}>
        noise / tape / dust
      </text>
      {range(14).map((i) => {
        const r = rng(i + 20);
        return <line key={i} x1={r() * W} y1={r() * H} x2={r() * W} y2={r() * H} stroke={cream} strokeWidth={0.6} opacity={0.35} />;
      })}
      <Grain u={u} opacity={0.5} freq={1.2} />
    </>
  ),

  punk: ([paper, black, pink, yellow], u) => {
    const letters = "NO FUTURE".split("");
    return (
      <>
        <rect width={W} height={H} fill={paper} />
        <rect x={30} y={60} width={250} height={320} fill={black} transform="rotate(-3 155 220)" />
        <rect x={160} y={260} width={210} height={170} fill={pink} transform="rotate(6 265 345)" style={{ mixBlendMode: "multiply" }} />
        {letters.map((ch, i) => {
          if (ch === " ") return null;
          const r = rng(i + 50);
          const x = 40 + (i % 5) * 64;
          const y = 120 + Math.floor(i / 5) * 110;
          const fills = [paper, yellow, "#FFFFFF", pink];
          const f = fills[i % 4]!;
          return (
            <g key={i} transform={`rotate(${(r() - 0.5) * 18} ${x + 26} ${y})`}>
              <rect x={x} y={y - 48} width={56} height={64} fill={f} stroke={black} strokeWidth={1.5} />
              <text x={x + 28} y={y + 6} textAnchor="middle" fontFamily={i % 2 ? serif : "Impact, sans-serif"} fontWeight={900} fontSize={54} fill={black}>
                {ch}
              </text>
            </g>
          );
        })}
        <path d="M60 440 h 180 a 10 10 0 0 1 0 20 h -170" fill="none" stroke={black} strokeWidth={3} />
        <circle cx={60} cy={440} r={8} fill="none" stroke={black} strokeWidth={3} />
        <Grain u={u} opacity={0.35} freq={1.6} />
      </>
    );
  },

  "new-wave": ([bg, navy, rose, cyan], u) => (
    <>
      <defs>
        <pattern id={`${u}d`} width={14} height={14} patternUnits="userSpaceOnUse">
          <circle cx={7} cy={7} r={2} fill={navy} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={bg} />
      <rect x={20} y={20} width={180} height={220} fill={`url(#${u}d)`} />
      {range(16).map((i) => (
        <rect key={i} x={200} y={60 + i * 8} width={180} height={3} fill={navy} />
      ))}
      <circle cx={250} cy={300} r={100} fill={cyan} />
      <path d="M40 470 L200 180 L260 470 Z" fill={rose} style={{ mixBlendMode: "multiply" }} />
      {range(5).map((i) => (
        <rect key={i} x={40 + i * 26} y={400 - i * 26} width={26} height={26 + i * 26} fill={navy} />
      ))}
      <text x={380} y={470} textAnchor="end" fontFamily={sans} fontWeight={300} fontSize={34} letterSpacing={12} fill={navy}>
        WAVE
      </text>
    </>
  ),

  graffiti: ([wall, magenta, mint, yellow], u) => (
    <>
      <defs>
        <filter id={`${u}spray`}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <rect width={W} height={H} fill={wall} />
      {range(25).map((i) => (
        <line key={i} x1={0} y1={i * 20} x2={W} y2={i * 20} stroke="#000" strokeWidth={0.6} opacity={0.2} />
      ))}
      <text x={20} y={130} fontFamily="'Brush Script MT', cursive" fontSize={48} fill="#ffffff" opacity={0.35} transform="rotate(-8 20 130)">
        tag tag
      </text>
      <path d="M40 300 C 40 200, 120 180, 150 240 L 170 170 L 230 180 L 210 300 C 250 220, 360 220, 360 300 C 360 380, 250 400, 210 350 L 200 400 L 120 390 C 70 390, 40 350, 40 300 Z" fill={magenta} filter={`url(#${u}spray)`} opacity={0.6} />
      <path d="M40 300 C 40 200, 120 180, 150 240 L 170 170 L 230 180 L 210 300 C 250 220, 360 220, 360 300 C 360 380, 250 400, 210 350 L 200 400 L 120 390 C 70 390, 40 350, 40 300 Z" fill={magenta} stroke="#111" strokeWidth={8} strokeLinejoin="round" />
      <path d="M70 300 C 80 250, 120 240, 140 280 M 240 300 C 260 260, 320 260, 330 300" fill="none" stroke={mint} strokeWidth={14} strokeLinecap="round" />
      <path d="M60 280 L 90 260 M 250 250 L 290 240" stroke={yellow} strokeWidth={6} strokeLinecap="round" />
      <path d="M340 260 L 390 220 L 370 290 Z" fill={mint} stroke="#111" strokeWidth={6} strokeLinejoin="round" />
      {[90, 140, 230, 300].map((x, i) => (
        <path key={x} d={`M${x} ${385 - (i % 2) * 10} v ${30 + i * 12}`} stroke={magenta} strokeWidth={5} strokeLinecap="round" />
      ))}
      <Grain u={u} opacity={0.3} freq={1.1} />
    </>
  ),
};
