import React, { useCallback, useEffect, useState } from "react";
import { FileText, Lock, Unlock } from "lucide-react";
import { listDocuments, shareDocument, unshareDocument, listSharedWithUs } from "./lib/api";
import { Banner } from "./shared.jsx";

// NOTE prototype : la sélection de l'organisation partenaire suppose de connaître
// son ID. En production, un sélecteur interrogerait un endpoint de recherche
// d'organisations (ex. GET /organizations?query=...). Ici, l'ID est saisi
// directement pour illustrer le mécanisme de partage réel décrit au §2.8.
export default function ShareView() {
  const [documents, setDocuments] = useState([]);
  const [sharedWithUs, setSharedWithUs] = useState([]);
  const [partnerOrgId, setPartnerOrgId] = useState("");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    setDocuments(await listDocuments());
    setSharedWithUs(await listSharedWithUs());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const toggleShare = async (doc) => {
    if (!partnerOrgId) return setError("Renseigne l'ID de l'organisation partenaire avant de partager.");
    try {
      if (doc.visibility === "PARTAGE") {
        await unshareDocument(doc.id, partnerOrgId);
        setToast(`Document « ${doc.title} » retiré du partage.`);
      } else {
        await shareDocument(doc.id, partnerOrgId);
        setToast(`Document « ${doc.title} » partagé.`);
      }
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl text-[#101B33] font-semibold mb-2">Partage inter-ONG</h1>
      <p className="text-sm text-[#7A8399] mb-6">
        Ressources documentaires visibles par les organisations partenaires — le partage est toujours une décision explicite.
      </p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="mb-4">
        <label className="text-xs text-[#7A8399] uppercase tracking-wide">ID de l'organisation partenaire</label>
        <input
          value={partnerOrgId}
          onChange={(e) => setPartnerOrgId(e.target.value)}
          placeholder="uuid de l'organisation à inviter"
          className="w-full mt-1 max-w-md border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
        />
      </div>

      <div className="text-xs text-[#7A8399] uppercase tracking-wide mb-2">Nos documents</div>
      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5] mb-8">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-[#9AA3B5]" />
              <div className="text-sm text-[#101B33]">{d.title}</div>
            </div>
            <button
              onClick={() => toggleShare(d)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm ${
                d.visibility === "PARTAGE" ? "bg-[#EFF6EE] text-[#2F5233]" : "bg-[#F0F1F5] text-[#7A8399]"
              }`}
            >
              {d.visibility === "PARTAGE" ? <Unlock size={13} /> : <Lock size={13} />}
              {d.visibility === "PARTAGE" ? "Partagé" : "Privé"}
            </button>
          </div>
        ))}
        {documents.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun document pour l'instant.</div>}
      </div>

      <div className="text-xs text-[#7A8399] uppercase tracking-wide mb-2">Partagés avec nous par des partenaires</div>
      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {sharedWithUs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-5 py-3">
            <FileText size={16} className="text-[#9AA3B5]" />
            <div className="text-sm text-[#101B33]">{d.title}</div>
          </div>
        ))}
        {sharedWithUs.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Rien de partagé avec nous pour l'instant.</div>}
      </div>
    </div>
  );
}
