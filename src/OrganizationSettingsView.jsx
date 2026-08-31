import React, { useCallback, useEffect, useState } from "react";
import { Building2, Save, Image as ImageIcon, Landmark, Plus, Trash2 } from "lucide-react";
import { getMyOrganization, updateMyOrganization, listBankAccounts, createBankAccount, deleteBankAccount } from "./lib/api";
import { Banner, KpiCard } from "./shared.jsx";

const ORG_TYPES = [
  { value: "ONG", label: "ONG / Association" },
  { value: "BAILLEUR", label: "Bailleur de fonds" },
  { value: "PRESTATAIRE", label: "Prestataire / Consultant" },
  { value: "AUTRE", label: "Autre acteur du développement" },
];

function NewBankAccountForm({ onCreate, onCancel }) {
  const [label, setLabel] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("GNF");
  const [isDefault, setIsDefault] = useState(false);

  const canSubmit = label && bankName && accountNumber;

  return (
    <div className="bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3 mb-3">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé (ex. : Compte dédié USAID StopPalu)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Nom de la banque (ex. BICIGUI)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          <option value="GNF">GNF</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <input value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} placeholder="Adresse de l'agence (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Numéro de compte" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-xs text-[#3D4761]">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Compte par défaut de l'organisation
      </label>
      <div className="flex gap-2">
        <button
          disabled={!canSubmit}
          onClick={() => onCreate({ label, bankName, bankAddress: bankAddress || undefined, accountNumber, currency, isDefault })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Ajouter le compte
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

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
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showBankForm, setShowBankForm] = useState(false);
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
    setBankAccounts(await listBankAccounts());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreateBankAccount = async (payload) => {
    try {
      await createBankAccount(payload);
      setShowBankForm(false);
      await refresh();
      setToast("Compte bancaire ajouté.");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteBankAccount = async (id) => {
    try {
      await deleteBankAccount(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  /**
   * Redimensionne et compresse automatiquement l'image de logo côté
   * navigateur (canvas) plutôt que de simplement refuser les fichiers trop
   * lourds — un vrai logo d'ONG (souvent exporté en haute résolution) doit
   * pouvoir être utilisé tel quel sans que l'utilisateur ait à le
   * pré-compresser lui-même dans un autre outil.
   */
  const handleLogoFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Le fichier sélectionné n'est pas une image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 300; // suffisant pour un logo imprimé sur documents PDF
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // PNG conservé si transparence probable (logo), sinon JPEG plus léger
        const isLikelyTransparent = file.type === "image/png" || file.type === "image/svg+xml";
        const dataUrl = canvas.toDataURL(isLikelyTransparent ? "image/png" : "image/jpeg", 0.85);
        setLogoUrl(dataUrl);
        setError(null);
      };
      img.onerror = () => setError("Impossible de lire cette image — réessaie avec un autre fichier.");
      img.src = reader.result;
    };
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
              <p className="text-xs text-[#9AA3B5] mt-1">PNG, JPEG ou SVG — redimensionné et compressé automatiquement. Apparaîtra sur bulletins, factures et TDR.</p>
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

      <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#7A8399] uppercase tracking-wide font-medium">
            <Landmark size={14} /> Comptes bancaires
          </div>
          {isAdmin && !showBankForm && (
            <button onClick={() => setShowBankForm(true)} className="text-xs text-[#1B2A4A] hover:underline flex items-center gap-1">
              <Plus size={12} /> Ajouter un compte
            </button>
          )}
        </div>
        <p className="text-xs text-[#9AA3B5]">
          Une organisation avec plusieurs projets peut avoir plusieurs comptes, dans des banques différentes — chaque demande de paiement choisit le compte à utiliser.
        </p>

        {showBankForm && <NewBankAccountForm onCreate={handleCreateBankAccount} onCancel={() => setShowBankForm(false)} />}

        <div className="divide-y divide-[#F0F1F5]">
          {bankAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-sm text-[#101B33] flex items-center gap-2">
                  {acc.label}
                  {acc.isDefault && <span className="text-xs px-1.5 py-0.5 rounded-sm bg-[#EFF6EE] text-[#2F5233]">Par défaut</span>}
                </div>
                <div className="text-xs text-[#9AA3B5] mt-0.5">{acc.bankName} · {acc.accountNumber} · {acc.currency}</div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDeleteBankAccount(acc.id)} className="text-[#B7BFCE] hover:text-[#9B2C2C]">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {bankAccounts.length === 0 && !showBankForm && (
            <div className="py-3 text-sm text-[#7A8399]">Aucun compte enregistré — les demandes de paiement utiliseront les coordonnées bancaires par défaut ci-dessus.</div>
          )}
        </div>
      </div>
    </div>
  );
}
