"use client";

import { useEffect, useState } from "react";

type Membership = {
  id: string;
  status: string;
  appliedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  organization: {
    id: number;
    name: string;
    countyId: number;
  };
  approvedBy?: {
    firstName: string;
    lastName: string;
  } | null;
};

const statusOptions = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"];

export default function MembershipsClient() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [status, setStatus] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [countyId, setCountyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadMemberships = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (organizationId) params.set("organizationId", organizationId);
    if (countyId) params.set("countyId", countyId);

    const query = params.toString();
    const response = await fetch(`/api/memberships${query ? `?${query}` : ""}`, { cache: "no-store" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError((data as { message?: string } | null)?.message ?? "Nu am putut încărca memberships.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as Membership[];
    setMemberships(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadMemberships();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionId(id);
    setError(null);
    const response = await fetch(`/api/memberships/${id}/${action}`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError((data as { message?: string } | null)?.message ?? "Acțiunea a eșuat.");
      setActionId(null);
      return;
    }

    await loadMemberships();
    setActionId(null);
  };

  const renderDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void loadMemberships();
        }}
        style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: 8 }}>
            <option value="">Toate</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          County ID
          <input
            type="number"
            min="1"
            value={countyId}
            onChange={(event) => setCountyId(event.target.value)}
            placeholder="ex: 1"
            style={{ padding: 8 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          Organization ID
          <input
            type="number"
            min="1"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            placeholder="ex: 12"
            style={{ padding: 8 }}
          />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit" style={{ padding: 10 }}>
            Aplică filtre
          </button>
        </div>
      </form>

      {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
      {loading ? <p>Se încarcă memberships...</p> : null}

      {!loading ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Membru</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Contact</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Organizație</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Status</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Aplicat</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((membership) => {
                const name = `${membership.user.firstName} ${membership.user.lastName}`.trim();
                const contact = membership.user.email ?? membership.user.phone ?? "-";
                const displayName = name || contact;
                const isPending = membership.status === "PENDING";
                return (
                  <tr key={membership.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{displayName}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{contact}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{membership.organization.name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{membership.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{renderDate(membership.appliedAt)}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => void handleAction(membership.id, "approve")}
                          disabled={!isPending || actionId === membership.id}
                          style={{ padding: "6px 10px" }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAction(membership.id, "reject")}
                          disabled={!isPending || actionId === membership.id}
                          style={{ padding: "6px 10px" }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {memberships.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12 }}>
                    Nicio cerere găsită pentru filtrele selectate.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
