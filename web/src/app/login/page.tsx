import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { AUTH_COOKIE } from "../../lib/auth";

export default function LoginPage() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (token) {
    redirect("/dashboard");
  }

  return (
    <main style={{ maxWidth: 480 }}>
      <h1>Admin login</h1>
      <p>Autentifică-te cu email sau telefon pentru a accesa dashboard-ul.</p>
      <LoginForm />
    </main>
  );
}
