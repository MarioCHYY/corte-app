import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/ui/Form";
import { btnDanger } from "@/components/ui/styles";
import { deleteExpense } from "@/lib/groups/actions";
import { loadGroup } from "@/lib/groups/data";
import { ExpenseForm, type ExpenseFormInitial } from "../ExpenseForm";

export const metadata: Metadata = { title: "Editar gasto" };

const centsToText = (c: number) => (c / 100).toFixed(2);

export default async function EditExpensePage({ params }: PageProps<"/g/[groupId]/gastos/[expenseId]">) {
  const { groupId, expenseId } = await params;
  const data = await loadGroup(groupId);
  const e = data.expenses.find((x) => x.id === expenseId);
  if (!e) notFound();

  const shareIds = e.shares.map((s) => s.memberId);
  const initial: ExpenseFormInitial = {
    description: e.description,
    amount: centsToText(e.amount),
    date: e.date,
    kind: e.kind,
    paidType: e.cardId ? "card" : "member",
    cardId: e.cardId ?? data.cards[0]?.id ?? "",
    paidById: e.paidById ?? data.me.id,
    installments: e.installments,
    giftFor: e.giftFor ?? "",
    mode: e.splitMode === "percent" ? "percent" : e.splitMode === "exact" && e.kind === "shared" ? "exact" : "equal",
    memberIds: shareIds,
    single: shareIds[0] ?? data.me.id,
    exact: Object.fromEntries(e.shares.map((s) => [s.memberId, centsToText(s.amount)])),
    percents: Object.fromEntries(e.shares.map((s) => [s.memberId, s.basisPoints != null ? String(s.basisPoints / 100) : ""])),
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Editar gasto</h1>
        <form action={deleteExpense.bind(null, groupId, expenseId)}>
          <SubmitButton className={btnDanger} pendingText="Borrando…">
            Borrar gasto
          </SubmitButton>
        </form>
      </div>
      <ExpenseForm
        groupId={groupId}
        expenseId={expenseId}
        meId={data.me.id}
        members={data.members.map((m) => ({ id: m.id, name: m.name }))}
        cards={data.cards.map((c) => ({ id: c.id, name: c.name, cutoffDay: c.cutoffDay, dueDays: c.dueDays, holderName: data.memberName(c.holderId) }))}
        initial={initial}
        returnTo={`/g/${groupId}/movimientos`}
      />
    </>
  );
}
