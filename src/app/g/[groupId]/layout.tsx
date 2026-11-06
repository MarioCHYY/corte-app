import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { requireGroup } from "@/lib/groups/data";
import { GroupNav } from "./GroupNav";

export default async function GroupLayout({ children, params }: LayoutProps<"/g/[groupId]">) {
  const { groupId } = await params;
  const { user, group } = await requireGroup(groupId);
  const base = `/g/${groupId}`;
  return (
    <>
      <AppHeader userName={user.name} userId={user.id}>
        <Link href={base} className="block truncate font-display text-lg font-bold hover:text-lime">
          {group.name}
        </Link>
      </AppHeader>
      <GroupNav base={base} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-12">{children}</main>
    </>
  );
}
