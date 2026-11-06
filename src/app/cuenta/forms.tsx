"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui/Form";
import { btnPrimary, btnSecondary, input } from "@/components/ui/styles";
import { changeEmail, changePassword, deleteAccount, updateName } from "@/lib/account/actions";

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateName, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Nombre">
        <input name="name" required minLength={2} maxLength={60} defaultValue={name} className={input} autoComplete="name" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className={btnSecondary}>Guardar nombre</SubmitButton>
    </form>
  );
}

export function ChangeEmailForm({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [state, action] = useActionState(changeEmail, undefined);
  const [value, setValue] = useState(email);
  const changed = value.trim().toLowerCase() !== email;
  return (
    <form action={action} className="space-y-3">
      <Field label="Correo" hint={hasPassword ? undefined : "Viene de tu cuenta de Google"}>
        <input
          name="email"
          type="email"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!hasPassword}
          className={input}
          autoComplete="email"
        />
      </Field>
      {hasPassword && changed && (
        <Field label="Tu contraseña, para confirmar">
          <input name="password" type="password" required className={input} autoComplete="current-password" />
        </Field>
      )}
      <FormMessage state={state} />
      {hasPassword && (
        <SubmitButton className={btnSecondary} pendingText="Guardando…">
          Cambiar correo
        </SubmitButton>
      )}
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      {hasPassword && (
        <Field label="Contraseña actual">
          <input name="current" type="password" required className={input} autoComplete="current-password" />
        </Field>
      )}
      <Field label="Nueva contraseña" hint="Mínimo 8 caracteres">
        <input name="next" type="password" required minLength={8} className={input} autoComplete="new-password" />
      </Field>
      <Field label="Repite la nueva contraseña">
        <input name="confirm" type="password" required minLength={8} className={input} autoComplete="new-password" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className={btnPrimary} pendingText="Guardando…">
        {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
      </SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(deleteAccount, undefined);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 rounded-xl border border-coral/50 px-4 py-2.5 font-medium text-coral transition hover:bg-coral/10"
      >
        Quiero eliminar mi cuenta
      </button>
    );
  }
  return (
    <form action={action} className="mt-5 max-w-sm space-y-3">
      <Field label="Escribe ELIMINAR para confirmar">
        <input
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          className={`${input} uppercase tracking-widest`}
          autoFocus
        />
      </Field>
      {hasPassword && (
        <Field label="Tu contraseña">
          <input name="password" type="password" required className={input} autoComplete="current-password" />
        </Field>
      )}
      <FormMessage state={state} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
          Cancelar
        </button>
        <SubmitButton
          pendingText="Eliminando…"
          className="inline-flex items-center justify-center rounded-xl bg-coral px-4 py-2.5 font-semibold text-ink transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {confirm.trim().toUpperCase() === "ELIMINAR" ? "Eliminar para siempre" : "Eliminar cuenta"}
        </SubmitButton>
      </div>
    </form>
  );
}
