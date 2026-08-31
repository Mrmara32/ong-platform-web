import React, { useCallback, useEffect, useState } from "react";
import { Mail, Plus, Printer, Download, FileText } from "lucide-react";
import { listLetterTemplates, listLetters, createLetter, exportLetterPdf, printLetterPdf } from "./lib/api";
import { Banner, KpiCard } from "./shared.jsx";

function NewLetterForm({ templates, onCreate, onCancel }) {
  const [templateId, setTemplateId] = useState("");
  const [reference, setReference] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");

  const applyTemplate = (id) => {
    setTemplateId(id);
    const t = templates.find((t) => t.id === id);
    if (t) {
      setSubject(t.title);
      setBody(t.bodySample);
    }
  };

  const canSubmit = recipientTitle && subject && body && signatoryName && signatoryTitle;

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-2xl">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle lettre</div>
      <select value={templateId} onChange={(e) => applyTemplate(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        <option value="">Partir d'une page blanche</option>
        {templates.map((t) => <option key={t.id} value={t.id}>{t.category} — {t.title}</option>)}
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence (ex. N° 014/CAM/BK/2026)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <input value={recipientTitle} onChange={(e) => setRecipientTitle(e.target.value)} placeholder="Destinataire (ex. Monsieur le Conseiller Régional...)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        placeholder="Corps de la lettre — remplace les balises {{...}} par le texte réel"
        className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
      />
      <p className="text-xs text-[#9AA3B5]">
        {"Si tu es parti d'un modèle, remplace chaque balise {{...}} par le texte réel avant d'enregistrer."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} placeholder="Nom du signataire" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} placeholder="Titre du signataire" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          disabled={!canSubmit}
          onClick={() => onCreate({ templateId: templateId || undefined, reference: reference || undefined, recipientTitle, subject, body, signatoryName, signatoryTitle })}
          className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Enregistrer la lettre
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function LettersView() {
  const [templates, setTemplates] = useState([]);
  const [letters, setLetters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setTemplates(await listLetterTemplates());
    setLetters(await listLetters());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createLetter(payload);
      setShowForm(false);
      await refresh();
      setToast("Lettre enregistrée.");
    } catch (e) {
      setError(e.message);
    }
  };

  const categories = ["Tous", ...new Set(templates.map((t) => t.category))];
  const visibleTemplates = categoryFilter === "Tous" ? templates : templates.filter((t) => t.category === categoryFilter);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <Mail size={20} className="text-[#1B2A4A]" /> Lettres de transmission
        </h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvelle lettre
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">Bibliothèque de modèles réutilisables — imprimés sur le papier à en-tête de l'organisation.</p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewLetterForm templates={templates} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="mb-6">
        <KpiCard label="Modèles disponibles" value={templates.length} accent="#1B2A4A" />
      </div>

      <div className="mb-6">
        <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium mb-2">Bibliothèque de modèles</div>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-sm ${categoryFilter === c ? "bg-[#1B2A4A] text-white" : "bg-[#F0F1F5] text-[#7A8399] hover:bg-[#E4E7EE]"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
          {visibleTemplates.map((t) => (
            <div key={t.id} className="flex items-start gap-3 px-5 py-3">
              <FileText size={15} className="text-[#9AA3B5] mt-0.5 shrink-0" />
              <div>
                <div className="text-sm text-[#101B33]">{t.title}</div>
                <div className="text-xs text-[#9AA3B5] mt-0.5">{t.category}</div>
              </div>
            </div>
          ))}
          {visibleTemplates.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun modèle dans cette catégorie.</div>}
        </div>
      </div>

      <div>
        <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium mb-2">Lettres enregistrées</div>
        <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
          {letters.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-5 py-3 flex-wrap gap-2">
              <div>
                <div className="text-sm text-[#101B33]">{l.subject}</div>
                <div className="text-xs text-[#9AA3B5] mt-0.5">{l.reference && `${l.reference} · `}{new Date(l.createdAt).toLocaleDateString("fr-FR")} · {l.recipientTitle}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printLetterPdf(l.id)} className="p-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]" title="Imprimer">
                  <Printer size={14} />
                </button>
                <button onClick={() => exportLetterPdf(l.id, l.reference)} className="p-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]" title="Télécharger">
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
          {letters.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucune lettre enregistrée pour l'instant.</div>}
        </div>
      </div>
    </div>
  );
}
