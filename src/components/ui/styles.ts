/** Clases compartidas para que toda la app se vea igual. */
export const input =
  "w-full rounded-xl border border-line bg-ink px-3 py-2.5 text-paper placeholder:text-mute/60 outline-none transition focus:border-lime focus:ring-2 focus:ring-lime/30 disabled:opacity-50";

export const label = "text-xs font-medium text-mute";

export const card = "rounded-3xl border border-line bg-slate-2";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 font-semibold text-ink transition hover:bg-lime-dim disabled:opacity-60 disabled:cursor-not-allowed";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate px-4 py-2.5 font-medium text-paper transition hover:border-mute/60 disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-mute transition hover:bg-slate hover:text-paper";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-coral/40 px-4 py-2.5 font-medium text-coral transition hover:bg-coral/10";

export const chip = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-lime text-ink" : "bg-slate text-paper/80 hover:bg-line"}`;
