import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "../../lib/auth";

export default function DashboardPage() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 800 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/memberships">Memberships</Link>
      </nav>
      <h1>Admin dashboard</h1>
      <p>Folosește meniul pentru a gestiona cererile de membership.</p>
      <p>
        <Link href="/memberships">Deschide lista de memberships →</Link>
      </p>
    </main>
  );
}
