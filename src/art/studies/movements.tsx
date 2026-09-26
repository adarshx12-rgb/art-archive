import { Grain, H, W, range, rng, starPath, type Renderer } from "../util";

const sans = "'Schibsted Grotesk Variable', Helvetica, Arial, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";

export const movementStudies: Record<string, Renderer> = {
  swiss: ([bg, ink, red, grey]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      {range(6).map((i) => (
        <line key={i} x1={40 + i * 64} y1={0} x2={40 + i * 64} y2={H} stroke={grey} strokeWidth={0.5} opacity={0.5} />
      ))}
      <circle cx={318} cy={118} r={128} fill={red} />
      <rect x={40} y={0} width={24} height={330} fill={ink} />
      <rect x={104} y={250} width={152} height={8} fill={ink} />
      <text x={36} y={430} fontFamily={sans} fontWeight={800} fontSize={118} letterSpacing={-7} fill={ink}>
        form
      </text>
      {range(5).map((i) => (
        <rect key={i} x={232} y={272 + i * 12} width={i % 2 ? 90 : 124} height={4} fill={ink} />
      ))}
      <text x={40} y={470} fontFamily={sans} fontSize={11} fill={ink}>
        Konzert 1 / 2 / 3
      </text>
    </>
  ),

  bauhaus: ([bg, red, yellow, blue]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={56} y={250} width={190} height={190} fill={blue} />
      <circle cx={250} cy={196} r={112} fill={red} style={{ mixBlendMode: "multiply" }} />
      <path d="M190 470 L330 230 L370 470 Z" fill={yellow} style={{ mixBlendMode: "multiply" }} />
      <rect x={30} y={70} width={300} height={22} fill="#141414" transform="rotate(-18 180 81)" />
      <path d="M40 160 A60 60 0 0 1 160 160 Z" fill="#141414" />
      <circle cx={338} cy={70} r={16} fill="#141414" />
    </>
  ),

  constructivism: ([bg, red, black, grey]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={-40} y={300} width={500} height={260} fill={black} transform="rotate(-22 200 400)" />
      <circle cx={270} cy={210} r={96} fill={bg} stroke={black} strokeWidth={4} />
      <path d="M20 90 L300 205 L20 150 Z" fill={red} />
      {range(9).map((i) => (
        <line key={i} x1={330} y1={40} x2={40 + i * 44} y2={500} stroke={black} strokeWidth={1} opacity={0.5} />
      ))}
      <rect x={250} y={360} width={120} height={28} fill={red} transform="rotate(-22 310 374)" />
      <rect x={40} y={30} width={80} height={12} fill={grey} transform="rotate(-22 80 36)" />
      <text x={70} y={470} fontFamily={sans} fontWeight={900} fontSize={54} fill={bg} transform="rotate(-22 70 470)">
        ВПЕРЁД
      </text>
    </>
  ),

  "art-deco": ([bg, gold, ivory, jade]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      {range(19).map((i) => {
        const a = Math.PI + (i / 18) * Math.PI;
        return (
          <line key={i} x1={200} y1={420} x2={200 + Math.cos(a) * 420} y2={420 + Math.sin(a) * 420} stroke={gold} strokeWidth={i % 2 ? 1 : 3} opacity={0.8} />
        );
      })}
      {[150, 120, 90, 60].map((r, i) => (
        <path key={r} d={`M${200 - r} 420 A${r} ${r} 0 0 1 ${200 + r} 420`} fill={i % 2 ? jade : bg} stroke={gold} strokeWidth={2} />
      ))}
      <path d="M140 420 V250 H160 V200 H180 V150 H200 V90 H200 V150 H220 V200 H240 V250 H260 V420 Z" fill={ivory} opacity={0.92} />
      <path d="M200 60 L208 150 L192 150 Z" fill={gold} />
      {range(6).map((i) => (
        <line key={i} x1={150 + i * 20} y1={270} x2={150 + i * 20} y2={420} stroke={bg} strokeWidth={3} />
      ))}
      <rect x={0} y={420} width={W} height={80} fill={bg} />
      {range(10).map((i) => (
        <path key={i} d={`M${i * 40} 450 l20 -16 l20 16`} fill="none" stroke={gold} strokeWidth={2} />
      ))}
      <rect x={20} y={20} width={360} height={460} fill="none" stroke={gold} strokeWidth={1.5} />
    </>
  ),

  "art-nouveau": ([bg, ochre, sage, madder], u) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <path d="M40 480 V170 A160 160 0 0 1 360 170 V480 Z" fill="none" stroke={madder} strokeWidth={6} />
      <circle cx={200} cy={190} r={112} fill={ochre} opacity={0.85} />
      <circle cx={200} cy={190} r={112} fill="none" stroke={madder} strokeWidth={2} strokeDasharray="2 6" />
      {range(7).map((i) => (
        <path
          key={i}
          d={`M${200 + (i - 3) * 8} 140 C ${120 + i * 30} 220, ${40 + i * 50} 280, ${90 + i * 36} 470`}
          fill="none"
          stroke={i % 2 ? sage : madder}
          strokeWidth={i % 2 ? 7 : 3}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={200} cy={170} rx={42} ry={54} fill={bg} stroke={madder} strokeWidth={3} />
      {range(6).map((i) => (
        <g key={i} transform={`translate(${70 + i * 52} ${440 - (i % 2) * 18})`}>
          <ellipse rx={9} ry={20} fill={sage} transform="rotate(-25)" />
          <circle cy={-22} r={8} fill={madder} />
        </g>
      ))}
      <Grain u={u} opacity={0.12} />
    </>
  ),

  modernism: ([bg, black, red, blue]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={0} y={0} width={250} height={290} fill={red} />
      <rect x={262} y={380} width={138} height={120} fill={blue} />
      <rect x={0} y={420} width={60} height={80} fill="#E9C33A" />
      {[
        [250, 0, 12, H],
        [0, 290, W, 12],
        [60, 302, 10, 198],
        [262, 368, 138, 12],
        [340, 0, 8, 290],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={black} />
      ))}
    </>
  ),

  minimalism: ([bg, graphite, stone, grey]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <rect x={0} y={330} width={W} height={170} fill={stone} opacity={0.45} />
      <rect x={250} y={250} width={54} height={80} fill={graphite} />
      <ellipse cx={277} cy={332} rx={60} ry={5} fill={grey} opacity={0.4} />
      <line x1={40} y1={60} x2={110} y2={60} stroke={graphite} strokeWidth={1} />
    </>
  ),

  brutalism: ([concrete, shadow, sky, recess], u) => (
    <>
      <rect width={W} height={H} fill={sky} />
      <path d="M70 500 V60 H330 V500 Z" fill={concrete} />
      <path d="M330 60 L370 90 V500 H330 Z" fill={shadow} />
      {range(11).map((row) =>
        range(4).map((col) => (
          <g key={`${row}-${col}`}>
            <rect x={84 + col * 62} y={78 + row * 38} width={50} height={24} fill={recess} />
            <rect x={80 + col * 62} y={102 + row * 38} width={58} height={6} fill={concrete} />
            <rect x={80 + col * 62} y={108 + row * 38} width={58} height={3} fill={shadow} opacity={0.6} />
          </g>
        )),
      )}
      <rect x={40} y={440} width={330} height={60} fill={shadow} />
      <Grain u={u} opacity={0.3} freq={1.4} />
    </>
  ),

  "mid-century-modern": ([bg, mustard, teal, teak], u) => (
    <>
      <rect width={W} height={H} fill={bg} />
      <circle cx={130} cy={150} r={86} fill={teal} />
      <path d="M200 120 C 300 60, 380 150, 330 220 C 300 260, 250 200, 200 240 C 160 270, 140 190, 200 120 Z" fill={mustard} />
      {range(12).map((i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={300} y1={330} x2={300 + Math.cos(a) * 44} y2={330 + Math.sin(a) * 44} stroke={teak} strokeWidth={3} strokeLinecap="round" />;
      })}
      <circle cx={300} cy={330} r={7} fill={teak} />
      <rect x={60} y={360} width={170} height={36} rx={6} fill={teak} />
      <path d="M80 396 L66 470 M210 396 L224 470" stroke={teak} strokeWidth={6} strokeLinecap="round" />
      <path d="M40 300 Q 90 270 140 300 T 240 300" fill="none" stroke={teal} strokeWidth={4} />
      <Grain u={u} opacity={0.14} />
    </>
  ),

  "post-modernism": ([salmon, mint, ultra, sand]) => (
    <>
      <rect width={W} height={H} fill={salmon} />
      <rect x={0} y={380} width={W} height={120} fill={ultra} />
      {range(8).map((i) => (
        <rect key={i} x={i * 50} y={380} width={25} height={120} fill={salmon} opacity={0.35} />
      ))}
      <path d="M90 380 V200 A110 110 0 0 1 310 200 V380 H260 V210 A60 60 0 0 0 140 210 V380 Z" fill={mint} />
      <path d="M70 150 L200 70 L330 150 Z" fill={sand} />
      <rect x={30} y={170} width={36} height={210} fill={sand} />
      <rect x={334} y={170} width={36} height={210} fill={sand} />
      {range(5).map((i) => (
        <line key={i} x1={36 + i * 6} y1={170} x2={36 + i * 6} y2={380} stroke={salmon} strokeWidth={1.5} />
      ))}
      <circle cx={200} cy={290} r={34} fill={ultra} />
      <rect x={176} y={340} width={48} height={40} fill="#1A1A1A" />
    </>
  ),

  deconstructivism: ([bg, steel, carbon, oxide]) => (
    <>
      <rect width={W} height={H} fill={bg} />
      {range(10).map((i) => (
        <line key={i} x1={0} y1={i * 55} x2={W} y2={i * 55 + 40} stroke={steel} strokeWidth={0.6} />
      ))}
      <rect x={60} y={80} width={240} height={150} fill={steel} transform="rotate(12 180 155)" opacity={0.9} />
      <rect x={120} y={190} width={220} height={200} fill={carbon} transform="rotate(-9 230 290)" />
      <rect x={30} y={260} width={180} height={110} fill={bg} stroke={carbon} strokeWidth={3} transform="rotate(24 120 315)" />
      <path d="M0 330 L400 250 L400 262 L0 346 Z" fill={oxide} />
      <text x={70} y={450} fontFamily={sans} fontWeight={700} fontSize={64} fill={carbon} transform="rotate(-6 70 450)" letterSpacing={-2}>
        split
      </text>
      <text x={210} y={130} fontFamily={sans} fontSize={30} fill={bg} transform="rotate(12 210 130)">
        plane / plane
      </text>
    </>
  ),

  "pop-art": ([yellow, red, blue, black], u) => (
    <>
      <defs>
        <pattern id={`${u}dots`} width={12} height={12} patternUnits="userSpaceOnUse">
          <circle cx={6} cy={6} r={3.2} fill={red} />
        </pattern>
        <pattern id={`${u}bdots`} width={9} height={9} patternUnits="userSpaceOnUse">
          <circle cx={4.5} cy={4.5} r={2.2} fill={black} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={yellow} />
      <rect width={W} height={H} fill={`url(#${u}dots)`} opacity={0.5} />
      <path d={starPath(200, 250, 190, 110, 12)} fill={red} stroke={black} strokeWidth={6} />
      <path d="M90 170 Q 200 100 310 170 Q 330 280 220 290 L 170 340 L 180 290 Q 70 280 90 170 Z" fill="#FFFFFF" stroke={black} strokeWidth={6} />
      <text x={200} y={240} textAnchor="middle" fontFamily="Impact, 'Arial Black', sans-serif" fontSize={64} fill={red} stroke={black} strokeWidth={3}>
        POW!
      </text>
      <circle cx={110} cy={420} r={60} fill={blue} stroke={black} strokeWidth={6} />
      <circle cx={110} cy={420} r={60} fill={`url(#${u}bdots)`} opacity={0.35} />
    </>
  ),

  memphis: ([bg, pink, aqua, yellow]) => {
    const r = rng(7);
    return (
      <>
        <rect width={W} height={H} fill={bg} />
        {range(40).map((i) => {
          const x = r() * W;
          const y = r() * H;
          return <rect key={i} x={x} y={y} width={10} height={3} fill="#151515" transform={`rotate(${Math.round(r() * 180)} ${x} ${y})`} />;
        })}
        <rect x={60} y={200} width={110} height={220} fill={pink} stroke="#151515" strokeWidth={3} />
        <ellipse cx={115} cy={200} rx={55} ry={16} fill={pink} stroke="#151515" strokeWidth={3} />
        <path d="M220 420 L300 250 L380 420 Z" fill={aqua} stroke="#151515" strokeWidth={3} />
        <circle cx={290} cy={130} r={62} fill={yellow} stroke="#151515" strokeWidth={3} />
        <path d="M40 90 q 20 -30 40 0 t 40 0 t 40 0 t 40 0" fill="none" stroke="#151515" strokeWidth={5} strokeLinecap="round" />
        <path d="M200 470 q 15 -22 30 0 t 30 0 t 30 0 t 30 0 t 30 0" fill="none" stroke={pink} strokeWidth={6} strokeLinecap="round" />
        {range(5).map((i) => (
          <line key={i} x1={70 + i * 20} y1={250} x2={70 + i * 20} y2={400} stroke="#151515" strokeWidth={2} strokeDasharray="4 10" />
        ))}
      </>
    );
  },
};


export { sans, serif };
