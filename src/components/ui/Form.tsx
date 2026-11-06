"use client";

import { useFormStatus } from "react-dom";
import { btnPrimary, label as labelCls } from "./styles";

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  className = btnPrimary,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">
        {state.error}
      </p>
    );
  }
  if (state?.ok) return <p className="rounded-xl bg-lime/10 px-3 py-2 text-sm text-lime">{state.ok}</p>;
  return null;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-mute/80">{hint}</span>}
    </label>
  );
}
