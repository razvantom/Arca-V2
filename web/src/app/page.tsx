"use client";

import { useEffect, useMemo, useState } from "react";

type County = { id: number; name: string };
type Org = { id: number; name: string };
type Locality = { id: number; name: string };
type Section = { id: number; number: number; name: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function Page() {
  const [counties, setCounties] = useState<County[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [countyId, setCountyId] = useState<number | "">("");
  const [orgId, setOrgId] = useState<number | "">("");
  const [localityId, setLocalityId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");

  useEffect(() => {
    fetch(`${API}/api/v1/geo/counties`).then(r => r.json()).then(setCounties).catch(console.error);
  }, []);

  useEffect(() => {
    setOrgs([]); setOrgId(""); setLocalities([]); setLocalityId(""); setSections([]); setSectionId("");
    if (countyId === "") return;
    fetch(`${API}/api/v1/geo/counties/${countyId}/organizations`).then(r => r.json()).then(setOrgs).catch(console.error);
  }, [countyId]);

  useEffect(() => {
    setLocalities([]); setLocalityId(""); setSections([]); setSectionId("");
    if (orgId === "") return;
    fetch(`${API}/api/v1/geo/organizations/${orgId}/localities`).then(r => r.json()).then(setLocalities).catch(console.error);
  }, [orgId]);

  useEffect(() => {
    setSections([]); setSectionId("");
    if (localityId === "") return;
    fetch(`${API}/api/v1/geo/localities/${localityId}/polling-sections`).then(r => r.json()).then(setSections).catch(console.error);
  }, [localityId]);

  return (
    <main style={{ maxWidth: 900 }}>
      <h1>ARCA v2 — Web (MVP)</h1>
      <p>Test rapid pentru selecția: județ → UAT → localitate → secție de votare.</p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <label>
          Județ
          <select style={{ width: "100%", padding: 8 }} value={countyId} onChange={(e) => setCountyId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Selectează județ</option>
            {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label>
          UAT (Organizație)
          <select style={{ width: "100%", padding: 8 }} value={orgId} onChange={(e) => setOrgId(e.target.value ? Number(e.target.value) : "")} disabled={countyId === ""}>
            <option value="">Selectează UAT</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>

        <label>
          Localitate
          <select style={{ width: "100%", padding: 8 }} value={localityId} onChange={(e) => setLocalityId(e.target.value ? Number(e.target.value) : "")} disabled={orgId === ""}>
            <option value="">Selectează localitate</option>
            {localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>

        <label>
          Secție de votare
          <select style={{ width: "100%", padding: 8 }} value={sectionId} onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : "")} disabled={localityId === ""}>
            <option value="">Selectează secție</option>
            {sections.map(s => <option key={s.id} value={s.id}>#{s.number} — {s.name}</option>)}
          </select>
        </label>
      </div>

      <pre style={{ marginTop: 16, padding: 12, background: "#f6f6f6", borderRadius: 8 }}>
{JSON.stringify({ countyId, orgId, localityId, sectionId }, null, 2)}
      </pre>

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Următorul pas: ecran de Register care trimite aceste ID-uri către <code>/api/v1/auth/register</code>.
      </p>
    </main>
  );
}
