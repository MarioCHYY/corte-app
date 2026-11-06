import { useId } from "react";

// Generado a partir de branding/logo. La palabra está convertida a trazos (Space Grotesk Bold).
const WORD_D = "M16.45 42.50Q11.84 42.50 8.10 40.58Q4.35 38.66 2.18 35.01Q0 31.36 0 26.18L0 25.28Q0 20.10 2.18 16.45Q4.35 12.80 8.10 10.88Q11.84 8.96 16.45 8.96Q20.99 8.96 24.26 10.56Q27.52 12.16 29.54 14.94Q31.55 17.73 32.19 21.25L24.38 22.91Q24.13 20.99 23.23 19.46Q22.34 17.92 20.70 17.02Q19.07 16.13 16.64 16.13Q14.21 16.13 12.26 17.18Q10.30 18.24 9.18 20.32Q8.06 22.40 8.06 25.41L8.06 26.05Q8.06 29.06 9.18 31.14Q10.30 33.22 12.26 34.27Q14.21 35.33 16.64 35.33Q20.29 35.33 22.18 33.44Q24.06 31.55 24.58 28.48L32.38 30.34Q31.55 33.73 29.54 36.51Q27.52 39.30 24.26 40.90Q20.99 42.50 16.45 42.50M51.90 42.50Q47.17 42.50 43.39 40.58Q39.62 38.66 37.44 35.01Q35.26 31.36 35.26 26.24L35.26 25.22Q35.26 20.10 37.44 16.45Q39.62 12.80 43.39 10.88Q47.17 8.96 51.90 8.96Q56.64 8.96 60.42 10.88Q64.19 12.80 66.37 16.45Q68.54 20.10 68.54 25.22L68.54 26.24Q68.54 31.36 66.37 35.01Q64.19 38.66 60.42 40.58Q56.64 42.50 51.90 42.50M51.90 35.33Q55.62 35.33 58.05 32.93Q60.48 30.53 60.48 26.05L60.48 25.41Q60.48 20.93 58.08 18.53Q55.68 16.13 51.90 16.13Q48.19 16.13 45.76 18.53Q43.33 20.93 43.33 25.41L43.33 26.05Q43.33 30.53 45.76 32.93Q48.19 35.33 51.90 35.33M81.79 41.60L73.73 41.60L73.73 9.86L81.66 9.86L81.66 13.44L82.82 13.44Q83.52 11.52 85.15 10.62Q86.78 9.73 88.96 9.73L92.80 9.73L92.80 16.90L88.83 16.90Q85.76 16.90 83.78 18.53Q81.79 20.16 81.79 23.55L81.79 41.60M117.95 41.60L108.99 41.60Q105.86 41.60 103.90 39.65Q101.95 37.70 101.95 34.43L101.95 16.51L94.02 16.51L94.02 9.86L101.95 9.86L101.95 0L110.02 0L110.02 9.86L118.72 9.86L118.72 16.51L110.02 16.51L110.02 33.02Q110.02 34.94 111.81 34.94L117.95 34.94L117.95 41.60M137.09 42.50Q132.35 42.50 128.74 40.48Q125.12 38.46 123.10 34.78Q121.09 31.10 121.09 26.11L121.09 25.34Q121.09 20.35 123.07 16.67Q125.06 12.99 128.64 10.98Q132.22 8.96 136.96 8.96Q141.63 8.96 145.09 11.04Q148.54 13.12 150.46 16.80Q152.38 20.48 152.38 25.34L152.38 28.10L129.28 28.10Q129.41 31.36 131.71 33.41Q134.02 35.46 137.34 35.46Q140.74 35.46 142.34 33.98Q143.94 32.51 144.77 30.72L151.36 34.18Q150.46 35.84 148.77 37.79Q147.07 39.74 144.26 41.12Q141.44 42.50 137.09 42.50M129.34 22.08L144.19 22.08Q143.94 19.33 141.98 17.66Q140.03 16 136.90 16Q133.63 16 131.71 17.66Q129.79 19.33 129.34 22.08";
const T_CUT = "92.52,29.74 120.22,19.35 120.22,21.85 92.52,32.24";

type Variant = "dark" | "light";
const COLORS: Record<Variant, { card: string; chip: string; text: string }> = {
  dark: { card: "#C6F432", chip: "#121417", text: "#F2F2EE" },
  light: { card: "#121417", chip: "#C6F432", text: "#121417" },
};

function IconShapes({ id, card, chip }: { id: string; card: string; chip: string }) {
  return (
    <>
      <defs>
        <clipPath id={`${id}u`}>
          <polygon points="0,0 64,0 64,20.8 0,44.8" />
        </clipPath>
        <clipPath id={`${id}d`}>
          <polygon points="0,49.2 64,25.2 64,64 0,64" />
        </clipPath>
      </defs>
      <g fill={card} clipPath={`url(#${id}u)`}>
        <rect x="5" y="13" width="54" height="37" rx="8" />
      </g>
      <g transform="translate(1.6 2.4)">
        <g fill={card} clipPath={`url(#${id}d)`}>
          <rect x="5" y="13" width="54" height="37" rx="8" />
        </g>
      </g>
      <rect x="12" y="20" width="11" height="8.5" rx="2.2" fill={chip} />
    </>
  );
}

/** Ícono de corte (tarjeta partida). */
export function CorteIcon({ variant = "dark", className }: { variant?: Variant; className?: string }) {
  const id = useId().replace(/:/g, "");
  const c = COLORS[variant];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <IconShapes id={id} card={c.card} chip={c.chip} />
    </svg>
  );
}

/** Logotipo completo: ícono + palabra "corte". */
export function CorteLogo({ variant = "dark", className }: { variant?: Variant; className?: string }) {
  const id = useId().replace(/:/g, "");
  const c = COLORS[variant];
  return (
    <svg viewBox="0 0 256.7 88.32" className={className} role="img" aria-label="corte">
      <g transform="scale(1.38)">
        <IconShapes id={id} card={c.card} chip={c.chip} />
      </g>
      <defs>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="-5" y="-5" width="162" height="53">
          <rect x="-5" y="-5" width="162" height="53" fill="#fff" />
          <polygon points={T_CUT} fill="#000" />
        </mask>
      </defs>
      <g transform="translate(104.32 25.91)">
        <path d={WORD_D} fill={c.text} mask={`url(#${id}m)`} />
      </g>
    </svg>
  );
}
