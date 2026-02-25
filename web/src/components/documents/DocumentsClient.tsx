"use client";

import { useEffect, useState, type FormEvent } from "react";

type DocumentScopeType = "GLOBAL" | "COUNTY" | "ORG";

type Document = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  scopeType: DocumentScopeType;
  countyId?: number | null;
  organizationId?: number | null;
  createdAt: string;
};

type DocumentFormState = {
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: string;
  scopeType: DocumentScopeType;
  countyId: string;
  organizationId: string;
};

const scopeOptions: DocumentScopeType[] = ["GLOBAL", "COUNTY", "ORG"];

const initialFormState: DocumentFormState = {
  title: "",
  description: "",
  category: "",
  fileUrl: "",
  mimeType: "application/pdf",
  sizeBytes: "1",
  scopeType: "GLOBAL",
  countyId: "",
  organizationId: "",
};

export default function DocumentsClient() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [formState, setFormState] = useState<DocumentFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = async (response: Response, fallback: string) => {
    if (response.status === 403) return "Access denied";
    const data = await response.json().catch(() => null);
    return (data as { message?: string } | null)?.message ?? fallback;
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/documents", { cache: "no-store" });
    if (!response.ok) {
      setError(await getErrorMessage(response, "Nu am putut încărca documentele."));
      setDocuments([]);
      setLoading(false);
      return;
    }

    const data = (await response.json()) as Document[];
    setDocuments(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingId(null);
  };

  const handleScopeChange = (value: DocumentScopeType) => {
    setFormState((prev) => ({
      ...prev,
      scopeType: value,
      countyId: value === "COUNTY" ? prev.countyId : "",
      organizationId: value === "ORG" ? prev.organizationId : "",
    }));
  };

  const buildPayload = () => {
    const sizeBytes = Number(formState.sizeBytes);
    if (!Number.isFinite(sizeBytes) || sizeBytes < 1) {
      setError("Size must be at least 1 byte.");
      return null;
    }

    if (formState.scopeType === "COUNTY" && !formState.countyId) {
      setError("County ID is required for COUNTY scope.");
      return null;
    }

    if (formState.scopeType === "ORG" && !formState.organizationId) {
      setError("Organization ID is required for ORG scope.");
      return null;
    }

    const payload: Record<string, unknown> = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      category: formState.category.trim(),
      fileUrl: formState.fileUrl.trim(),
      mimeType: formState.mimeType.trim(),
      sizeBytes,
      scopeType: formState.scopeType,
    };

    if (formState.scopeType === "COUNTY") {
      payload.countyId = Number(formState.countyId);
    }

    if (formState.scopeType === "ORG") {
      payload.organizationId = Number(formState.organizationId);
    }

    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    const response = await fetch(editingId ? `/api/documents/${editingId}` : "/api/documents", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError(await getErrorMessage(response, "Acțiunea a eșuat."));
      setSubmitting(false);
      return;
    }

    await loadDocuments();
    resetForm();
    setSubmitting(false);
  };

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setError(null);
    setFormState({
      title: document.title,
      description: document.description ?? "",
      category: document.category,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      sizeBytes: String(document.sizeBytes),
      scopeType: document.scopeType,
      countyId: document.countyId ? String(document.countyId) : "",
      organizationId: document.organizationId ? String(document.organizationId) : "",
    });
  };

  const handleDelete = async (document: Document) => {
    const confirmed = window.confirm(`Ștergi documentul \"${document.title}\"?`);
    if (!confirmed) return;

    setActionId(document.id);
    setError(null);
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError(await getErrorMessage(response, "Ștergerea a eșuat."));
      setActionId(null);
      return;
    }

    await loadDocuments();
    setActionId(null);
  };

  const renderScope = (document: Document) => {
    if (document.scopeType === "COUNTY") {
      return `COUNTY${document.countyId ? ` #${document.countyId}` : ""}`;
    }
    if (document.scopeType === "ORG") {
      return `ORG${document.organizationId ? ` #${document.organizationId}` : ""}`;
    }
    return "GLOBAL";
  };

  const renderDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  };

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>{editingId ? "Edit document" : "Create document"}</h2>
          {editingId ? (
            <button type="button" onClick={resetForm} style={{ padding: "6px 10px" }}>
              Cancel edit
            </button>
          ) : null}
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <label style={{ display: "grid", gap: 6 }}>
            Title
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              required
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Description
            <input
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Category
            <input
              value={formState.category}
              onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
              required
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            File URL
            <input
              value={formState.fileUrl}
              onChange={(event) => setFormState((prev) => ({ ...prev, fileUrl: event.target.value }))}
              required
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            MIME type
            <input
              value={formState.mimeType}
              onChange={(event) => setFormState((prev) => ({ ...prev, mimeType: event.target.value }))}
              required
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Size (bytes)
            <input
              type="number"
              min="1"
              value={formState.sizeBytes}
              onChange={(event) => setFormState((prev) => ({ ...prev, sizeBytes: event.target.value }))}
              required
              style={{ padding: 8 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Scope
            <select
              value={formState.scopeType}
              onChange={(event) => handleScopeChange(event.target.value as DocumentScopeType)}
              style={{ padding: 8 }}
            >
              {scopeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {formState.scopeType === "COUNTY" ? (
            <label style={{ display: "grid", gap: 6 }}>
              County ID
              <input
                type="number"
                min="1"
                value={formState.countyId}
                onChange={(event) => setFormState((prev) => ({ ...prev, countyId: event.target.value }))}
                required
                style={{ padding: 8 }}
              />
            </label>
          ) : null}
          {formState.scopeType === "ORG" ? (
            <label style={{ display: "grid", gap: 6 }}>
              Organization ID
              <input
                type="number"
                min="1"
                value={formState.organizationId}
                onChange={(event) => setFormState((prev) => ({ ...prev, organizationId: event.target.value }))}
                required
                style={{ padding: 8 }}
              />
            </label>
          ) : null}
        </div>
        <div>
          <button type="submit" style={{ padding: "10px 16px" }} disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Update document" : "Create document"}
          </button>
        </div>
      </form>

      {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
      {loading ? <p>Se încarcă documentele...</p> : null}

      {!loading ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Title</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Category</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Scope</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Created</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{document.title}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{document.category}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{renderScope(document)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{renderDate(document.createdAt)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => handleEdit(document)} style={{ padding: "6px 10px" }}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(document)}
                        disabled={actionId === document.id}
                        style={{ padding: "6px 10px" }}
                      >
                        {actionId === document.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12 }}>
                    Niciun document găsit.
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
