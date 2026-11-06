import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// La página promocional vive aparte (corte-web). Aquí "/" solo manda a donde toca.
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/grupos" : "/entrar");
}
