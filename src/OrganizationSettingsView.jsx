import React, { useCallback, useEffect, useState } from "react";
import { Building2, Save, Image as ImageIcon } from "lucide-react";
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
  const [address, setAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
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
    setAddress(data.address || "");
    setRegistrationNumber(data.registrationNumber || "");
    setTaxId(data.taxId || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setLogoUrl(data.logoUrl || "");
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleLogoFile = (file) => {
    if (!file) return;
    if (file.size > 500 * 1024) {
      setError("Le logo doit faire moins de 500 Ko (utilise une image compressée).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMyOrganization({ name, type, country, address, registrationNumber, taxId, phone, email, logoUrl });
      await refresh();
      setToast("Informations de l'organisation mises à jour — elles apparaîtront désormais sur les bulletins, factures et documents officiels.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!org) return <div className="p-8 text-sm text-[#7A8399]">Chargement…</div>;

  const field = (label, value, onChange, placeholder) => (
    <div>
      <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!isAdmin}
        placeholder={placeholder}
        className="w-full mt-1.5 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm disabled:bg-[#F5F6F9] disabled:text-[#9AA3B5]"
      />
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Building2 size={20} className="text-[#1B2A4A]" />
        <h1 className="text-xl text-[#101B33] font-semibold">Paramètres de l'organisation</h1>
      </div>

      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <KpiCard label="Membres" value={org._count?.users ?? "—"} accent="#1B2A4A" />
        <KpiCard label="Projets" value={org._count?.projects ?? "—"} accent="#2F855A" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-4">
        <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium mb-1">Identité générale</div>
        {field("Nom de l'organisation", name, setName)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          {field("Pays", country, setCountry)}
        </div>
        {field("Adresse du siège", address, setAddress, "Ex. : Quartier Almamya, Commune de Kaloum, Conakry")}

        <div className="h-px bg-[#EEF0F4] my-2" />
        <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium mb-1">
          Mentions légales — imprimées sur les documents officiels
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("N° d'agrément / récépissé", registrationNumber, setRegistrationNumber, "Ex. : A/2015/00123/MATD")}
          {field("NIF (identification fiscale)", taxId, setTaxId, "Optionnel")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("Téléphone", phone, setPhone, "Ex. : +224 620 00 00 00")}
          {field("Email de contact", email, setEmail, "contact@organisation.org")}
        </div>

        <div className="h-px bg-[#EEF0F4] my-2" />
        <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium mb-1">Logo</div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-sm border border-[#D8DCE6] flex items-center justify-center bg-[#FAFBFC] overflow-hidden shrink-0">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-[#B7BFCE]" />}
          </div>
          {isAdmin && (
            <div>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(e) => handleLogoFile(e.target.files?.[0])} className="text-xs" />
              <p className="text-xs text-[#9AA3B5] mt-1">PNG, JPEG ou SVG, moins de 500 Ko. Apparaîtra sur bulletins, factures et TDR.</p>
            </div>
          )}
        </div>

        {isAdmin ? (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-4 py-2 rounded-sm hover:bg-[#233459] disabled:opacity-50 mt-2"
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
