import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/lib/auth/session";

export default async function AccountLayout({ children }: LayoutProps<"/cuenta">) {
  const me = await requireUser();
  return (
    <>
      <AppHeader userName={me.name} userId={me.id} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </>
  );
}
