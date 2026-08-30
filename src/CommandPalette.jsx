import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";

/**
 * Palette de commande façon "Ctrl+K" : recherche instantanée parmi les
 * écrans de l'application et quelques actions rapides. Volontairement
 * fonctionnelle plutôt que décorative — un menu "Recherche" qui ne
 * chercherait rien de réel serait pire que pas de menu du tout.
 */
export default function CommandPalette({ open, onClose, items, onSelect }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-md shadow-xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EEF0F4]">
          <Search size={16} className="text-[#9AA3B5]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un écran ou une action…"
            className="flex-1 text-sm outline-none placeholder:text-[#B7BFCE]"
          />
          <kbd className="text-[10px] text-[#9AA3B5] border border-[#E4E7EE] rounded px-1.5 py-0.5">Échap</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[#9AA3B5] text-center">Aucun résultat pour « {query} ».</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#FAFBFC] group"
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={15} className="text-[#9AA3B5]" />}
                  <div>
                    <div className="text-sm text-[#101B33]">{item.label}</div>
                    {item.group && <div className="text-xs text-[#9AA3B5]">{item.group}</div>}
                  </div>
                </div>
                <CornerDownLeft size={13} className="text-[#D8DCE6] opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
