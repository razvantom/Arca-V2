"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginPayload = {
  email?: string;
  phone?: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload: LoginPayload = { password };
    if (identifier.includes("@")) {
      payload.email = identifier;
    } else {
      payload.phone = identifier;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      router.push("/dashboard");
      return;
    }

    const data = await response.json().catch(() => null);
    setError((data as { message?: string } | null)?.message ?? "Login failed");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <label style={{ display: "grid", gap: 6 }}>
        Email sau telefon
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="email@exemplu.ro sau 0712345678"
          required
          style={{ padding: 8 }}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Parolă
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ padding: 8 }}
        />
      </label>
      <button type="submit" disabled={loading} style={{ padding: 10 }}>
        {loading ? "Autentificare..." : "Autentificare"}
      </button>
      {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
    </form>
  );
}
