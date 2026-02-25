import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DocumentsClient from "../../components/documents/DocumentsClient";
import { AUTH_COOKIE } from "../../lib/auth";

export default function DocumentsPage() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 1100 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/memberships">Memberships</Link>
        <Link href="/documents">Documents</Link>
      </nav>
      <h1>Documents</h1>
      <DocumentsClient />
    </main>
  );
}
