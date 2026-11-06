import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { CorteIcon, CorteLogo } from "@/components/brand/Logo";
import { Avatar } from "@/components/display";
import { btnGhost } from "@/components/ui/styles";

export function AppHeader({ userName, userId, children }: { userName: string; userId?: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/grupos" aria-label="Mis grupos" className="shrink-0">
          <CorteLogo className="hidden h-7 w-auto sm:block" />
          <CorteIcon className="h-8 w-8 sm:hidden" />
        </Link>
        <div className="min-w-0 flex-1">{children}</div>
        <Link href="/cuenta" className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-mute transition hover:bg-slate hover:text-paper" aria-label="Mi cuenta">
          <Avatar id={userId ?? userName} name={userName} size={28} />
          <span className="hidden md:inline">{userName}</span>
        </Link>
        <form action={logout}>
          <button className={btnGhost}>Salir</button>
        </form>
      </div>
    </header>
  );
}
