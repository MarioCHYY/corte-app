import type { Metadata } from "next";
import { loadGroup } from "@/lib/groups/data";
import { ExpenseForm } from "../ExpenseForm";

export const metadata: Metadata = { title: "Agregar gasto" };

export default async function NewExpensePage({ params }: PageProps<"/g/[groupId]/gastos/nuevo">) {
  const { groupId } = await params;
  const data = await loadGroup(groupId);
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-bold">Agregar gasto</h1>
      <ExpenseForm
        groupId={groupId}
        meId={data.me.id}
        members={data.members.map((m) => ({ id: m.id, name: m.name }))}
        cards={data.cards
          .filter((c) => !c.archived)
          .map((c) => ({ id: c.id, name: c.name, cutoffDay: c.cutoffDay, dueDays: c.dueDays, holderName: data.memberName(c.holderId) }))}
        returnTo={`/g/${groupId}`}
      />
    </>
  );
}
