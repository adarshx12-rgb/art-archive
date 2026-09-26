import type { PaletteComposition } from "../content/types";

interface Props {
  /** Colours in role order: background, primary, [secondary], accent. */
  colours: { hex: string; share: number }[];
  composition: PaletteComposition;
  name: string;
  className?: string;
}

const PW = 400;
const PH = 300;

/**
 * A strict limited-colour composition: it uses ONLY the palette's colours,
 * roughly in their suggested proportions. This is what makes it an honest
 * demonstration — unlike a photo, which contains many more colours.
 */
export function PaletteArt({ colours, composition, name, className = "" }: Props) {
  const c = colours.map((x) => x.hex);
  const bg = c[0]!;
  const a = c[1] ?? bg;
  const b = c[2] ?? a;
  const d = c[3] ?? b;
  const shares = colours.map((x) => x.share);
  const n = colours.length;

  let body: React.ReactNode;
  switch (composition) {
    case "fields": {
      let y = 0;
      body = (
        <>
          {colours.map((col, i) => {
            const h = (col.share / 100) * PH;
            const el = <rect key={i} x={i === 0 ? 0 : 24} y={y} width={i === 0 ? PW : PW - 48} height={h} rx={i === 0 ? 0 : 6} fill={col.hex} />;
            y += h;
            return el;
          })}
        </>
      );
      break;
    }
    case "stripes": {
      let x = 0;
      body = (
        <>
          {colours.map((col, i) => {
            const w = (col.share / 100) * PW;
            const el = <rect key={i} x={x} y={0} width={w + 0.5} height={PH} fill={col.hex} />;
            x += w;
            return el;
          })}
          {n > 2 && <circle cx={PW * 0.72} cy={PH * 0.42} r={48} fill={c[n - 1]} stroke={bg} strokeWidth={6} />}
        </>
      );
      break;
    }
    case "arch":
      body = (
        <>
          <rect width={PW} height={PH} fill={bg} />
          <path d={`M80 ${PH} V150 A120 120 0 0 1 320 150 V${PH} Z`} fill={a} />
          {n > 2 && <path d={`M140 ${PH} V170 A60 60 0 0 1 260 170 V${PH} Z`} fill={n > 3 ? b : d} />}
          {n > 3 && <circle cx={200} cy={110} r={22} fill={d} />}
          {n === 2 && <rect x={0} y={PH - 30} width={PW} height={30} fill={a} />}
        </>
      );
      break;
    case "orbit":
      body = (
        <>
          <rect width={PW} height={PH} fill={bg} />
          <circle cx={170} cy={160} r={110} fill={a} />
          {n > 2 && <circle cx={280} cy={120} r={n > 3 ? 56 : 30} fill={n > 3 ? b : d} />}
          {n > 3 && <circle cx={300} cy={230} r={22} fill={d} />}
          {n === 2 && <circle cx={320} cy={70} r={24} fill="none" stroke={a} strokeWidth={6} />}
        </>
      );
      break;
    case "steps":
      body = (
        <>
          <rect width={PW} height={PH} fill={bg} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={40 + i * 80} y={PH - 60 - i * 50} width={80} height={60 + i * 50} fill={i < 2 ? a : n > 3 ? b : a} />
          ))}
          {n > 2 && <circle cx={320} cy={70} r={34} fill={d} />}
        </>
      );
      break;
    case "split":
      body = (
        <>
          <rect width={PW} height={PH} fill={bg} />
          <path d={`M${PW * (1 - shares[1]! / 100) * 1.1} 0 L${PW} 0 L${PW} ${PH} L${PW * 0.35} ${PH} Z`} fill={a} />
          {n > 2 && <rect x={60} y={60} width={90} height={90} fill={n > 3 ? b : d} />}
          {n > 3 && <rect x={100} y={100} width={30} height={30} fill={d} />}
        </>
      );
      break;
    case "window":
      body = (
        <>
          <rect width={PW} height={PH} fill={bg} />
          {[0, 1, 2].map((col) =>
            [0, 1].map((row) => {
              const idx = col + row * 3;
              const fill = idx === 4 && n > 2 ? d : idx % 3 === 1 && n > 3 ? b : a;
              return <rect key={idx} x={50 + col * 110} y={40 + row * 120} width={80} height={100} rx={40} ry={40} fill={fill} />;
            }),
          )}
        </>
      );
      break;
    case "wave":
    default:
      body = (
        <>
          <rect width={PW} height={PH} fill={bg} />
          {c.slice(1).map((col, i, arr) => {
            const y = 120 + i * (150 / Math.max(arr.length, 1));
            return <path key={i} d={`M0 ${y} C 100 ${y - 60}, 200 ${y + 60}, 400 ${y - 20} V ${PH} H 0 Z`} fill={col} />;
          })}
        </>
      );
  }

  return (
    <svg
      viewBox={`0 0 ${PW} ${PH}`}
      width={PW}
      height={PH}
      role="img"
      aria-label={`Composition for the ${name} palette using only its ${n} colours: ${c.join(", ")}.`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      {body}
    </svg>
  );
}
