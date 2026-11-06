import type { Metadata } from "next";
import Link from "next/link";
import { CorteIcon } from "@/components/brand/Logo";
import { DateText, daysLabel, Money } from "@/components/display";
import { card as cardCls } from "@/components/ui/styles";
import { loadGroup } from "@/lib/groups/data";
import { cardStatus } from "@/lib/groups/summary";
import { CardForm } from "./CardForm";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Tarjetas" };

export default async function CardsPage({ params }: PageProps<"/g/[groupId]/tarjetas">) {
  const { groupId } = await params;
  const data = await loadGroup(groupId);
  const cards = data.cards.filter((c) => !c.archived);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <section>
        <h1 className="font-display text-2xl font-bold">Tarjetas del grupo</h1>
        <p className="text-sm text-mute">Tarjetas de crédito que usan varios. Cada cargo se acomoda en su corte.</p>
        {cards.length === 0 ? (
          <p className={`${cardCls} mt-4 p-6 text-mute`}>
            Todavía no hay tarjetas. Si todos usan la tarjeta de alguien, agrégala aquí con su día de corte.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cards.map((c) => {
              const { summary, daysLeft } = cardStatus(data, c);
              return (
                <li key={c.id}>
                  <Link href={`/g/${groupId}/tarjetas/${c.id}`} className={`${cardCls} flex items-center gap-4 p-5 transition hover:border-lime/60`}>
                    <CorteIcon className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {c.name} {c.last4 && <span className="text-mute">•••• {c.last4}</span>}
                      </p>
                      <p className="text-sm text-mute">
                        Titular: {data.memberName(c.holderId)} · corte día {c.cutoffDay}
                      </p>
                      <p className="mt-1 text-sm">
                        Corte del <DateText date={summary.statement.cutoff} />: <Money cents={summary.total} className="font-semibold" />{" "}
                        <span className="text-mute">· {daysLabel(daysLeft)}</span>
                      </p>
                    </div>
                    <Icon name="chevronRight" className="h-5 w-5 text-lime" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className={`${cardCls} h-fit p-5`}>
        <h2 className="font-display text-lg font-bold">Agregar tarjeta</h2>
        <div className="mt-4">
          <CardForm groupId={groupId} members={data.members.map((m) => ({ id: m.id, name: m.name }))} />
        </div>
      </section>
    </div>
  );
}
