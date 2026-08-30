import React, { useCallback, useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { getMyOrganization, updateMyOrganization } from "./lib/api";
import { Banner, KpiCard } from "./shared.jsx";

const ORG_TYPES = [
  { value: "ONG", label: "ONG / Association" },
  { value: "BAILLEUR", label: "Bailleur de fonds" },
  { value: "PRESTATAIRE", label: "Prestataire / Consultant" },
  { value: "AUTRE", label: "Autre acteur du développement" },
];

export default function OrganizationSettingsView({ currentRole }) {
  const [org, setOrg] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("ONG");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = currentRole === "ADMIN";

  const refresh = useCallback(async () => {
    const data = await getMyOrganization();
    setOrg(data);
    setName(data.name);
    setType(data.type);
    setCountry(data.country || "");
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMyOrganization({ name, type, country });
      await refresh();
      setToast("Informations de l'organisation mises à jour.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!org) return <div className="p-8 text-sm text-[#7A8399]">Chargement…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Building2 size={20} className="text-[#1B2A4A]" />
        <h1 className="text-xl text-[#101B33] font-semibold">Paramètres de l'organisation</h1>
      </div>

      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard label="Membres" value={org._count?.users ?? "—"} accent="#1B2A4A" />
        <KpiCard label="Projets" value={org._count?.projects ?? "—"} accent="#2F855A" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-4">
        <div>
          <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Nom de l'organisation</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin}
            className="w-full mt-1.5 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm disabled:bg-[#F5F6F9] disabled:text-[#9AA3B5]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!isAdmin}
              className="w-full mt-1.5 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm disabled:bg-[#F5F6F9] disabled:text-[#9AA3B5]"
            >
              {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Pays</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={!isAdmin}
              className="w-full mt-1.5 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm disabled:bg-[#F5F6F9] disabled:text-[#9AA3B5]"
            />
          </div>
        </div>

        {isAdmin ? (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-4 py-2 rounded-sm hover:bg-[#233459] disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        ) : (
          <p className="text-xs text-[#9AA3B5]">Seul l'Admin/Président peut modifier ces informations.</p>
        )}
      </div>
    </div>
  );
}
