/**
 * Íconos de línea de corte (24×24, trazo de 1.8). Heredan el color del texto.
 * Uso: <Icon name="key" className="h-5 w-5" />
 */

const PATHS = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 19.5c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 15.2c1.6.6 2.8 2 3.5 4.3" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9" /><path d="M17 6l3 3" /><path d="M14.5 8.5l2 2" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  laptop: <><rect x="4" y="4.5" width="16" height="11" rx="1.5" /><path d="M2 19.5h20" /></>,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" /><path d="M9 12l2 2 4-4" /></>,
  download: <><path d="M12 4v11" /><path d="M7.5 10.5L12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>,
  trash: <><path d="M4 7h16" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /><path d="M10.5 11v5M13.5 11v5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" /><path d="M12 17h.01" /></>,
  message: <><path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" /></>,
  bug: <><rect x="7.5" y="7.5" width="9" height="12" rx="4.5" /><path d="M9.5 7.5a2.5 2.5 0 0 1 5 0" /><path d="M12 11v8.5M4 13h3.5M16.5 13H20M5 8.5l2.8 1.5M19 8.5l-2.8 1.5M5 18l2.8-1.5M19 18l-2.8-1.5" /></>,
  file: <><path d="M6.5 2.5h7.5l4.5 4.5v14.5h-12z" /><path d="M13.5 2.5V7.5h5" /><path d="M9 12.5h6M9 16h6" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><path d="M12 14.5v2.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  card: <><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 15h3" /></>,
  bank: <><path d="M3 9.5L12 4l9 5.5" /><path d="M4.5 9.5h15" /><path d="M6.5 12v5M10.5 12v5M13.5 12v5M17.5 12v5" /><path d="M3.5 20h17" /></>,
  home: <><path d="M3.5 11L12 4l8.5 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
  gift: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8.5h14V12" /><path d="M12 8v12.5" /><path d="M12 8c-1-3-5-4.5-5.5-2S10 8 12 8zM12 8c1-3 5-4.5 5.5-2S14 8 12 8z" /></>,
  cash: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 9.5v5M18 9.5v5" /></>,
  arrowUpRight: <><path d="M7 17L17 7" /><path d="M8.5 7H17v8.5" /></>,
  arrowRight: <><path d="M4.5 12h15" /><path d="M13.5 6l6 6-6 6" /></>,
  arrowLeft: <><path d="M19.5 12h-15" /><path d="M10.5 6l-6 6 6 6" /></>,
  arrowUp: <><path d="M12 19.5v-15" /><path d="M6 10.5l6-6 6 6" /></>,
  chevronRight: <path d="M9.5 5.5L16 12l-6.5 6.5" />,
  chevronLeft: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  external: <><path d="M14 4.5h5.5V10" /><path d="M19.5 4.5L11 13" /><path d="M17.5 14v5.5h-13v-13H10" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
  size = 20,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  /** Tamaño de respaldo en px: el ícono nunca se agranda aunque falte el CSS */
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
