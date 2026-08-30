import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

/**
 * Barre de menu façon logiciel de bureau. Chaque item est soit une action
 * réelle (navigation, impression, plein écran…), soit explicitement marqué
 * "bientôt" et désactivé — jamais une action qui fait semblant de marcher.
 */
function Dropdown({ label, items, openMenu, setOpenMenu }) {
  const isOpen = openMenu === label;
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenMenu(null);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [isOpen, setOpenMenu]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpenMenu(isOpen ? null : label)}
        className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${isOpen ? "bg-[#EEF0F4] text-[#101B33]" : "text-[#3D4761] hover:bg-[#F5F6F9]"}`}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-[#E4E7EE] rounded-md shadow-lg py-1.5 w-64 z-40">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="h-px bg-[#EEF0F4] my-1.5" />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { if (!item.disabled) { item.action?.(); setOpenMenu(null); } }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left ${
                  item.disabled ? "text-[#C9CEDA] cursor-not-allowed" : "text-[#3D4761] hover:bg-[#FAFBFC]"
                }`}
              >
                <span>{item.label}</span>
                {item.shortcut && <span className="text-xs text-[#B7BFCE]" style={mono}>{item.shortcut}</span>}
                {item.disabled && <span className="text-[10px] text-[#B7BFCE] uppercase tracking-wide">Bientôt</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function MenuBar({ onNavigate, onLogout, onOpenPalette, onToggleSidebar, onToggleFullscreen, onShowShortcuts, onShowAbout, orgName }) {
  const [openMenu, setOpenMenu] = useState(null);

  const menus = {
    "Fichier": [
      { label: "Nouveau projet", action: () => onNavigate("projects") },
      { label: "Nouvelle facture", action: () => onNavigate("invoicing") },
      { label: "Nouveau bulletin de paie", action: () => onNavigate("payroll") },
      { divider: true },
      { label: "Exporter le budget…", action: () => onNavigate("budget") },
      { label: "Imprimer la page", shortcut: "Ctrl+P", action: () => window.print() },
      { divider: true },
      { label: "Se déconnecter", action: onLogout },
    ],
    "Édition": [
      { label: "Annuler", shortcut: "Ctrl+Z", disabled: true },
      { label: "Rétablir", shortcut: "Ctrl+Y", disabled: true },
      { divider: true },
      { label: "Copier le lien de partage", disabled: true },
      { label: "Rechercher et remplacer", disabled: true },
    ],
    "Recherche": [
      { label: "Recherche rapide…", shortcut: "Ctrl+K", action: onOpenPalette },
      { divider: true },
      { label: "Rechercher un projet", action: () => onNavigate("projects") },
      { label: "Rechercher un document", action: () => onNavigate("docs") },
      { label: "Rechercher une facture", action: () => onNavigate("invoicing") },
      { label: "Recherche avancée multi-critères", disabled: true },
    ],
    "Affichage": [
      { label: "Tableau de bord", action: () => onNavigate("dashboard") },
      { label: "Réduire la barre latérale", action: onToggleSidebar },
      { label: "Mode plein écran", shortcut: "F11", action: onToggleFullscreen },
      { divider: true },
      { label: "Densité compacte", disabled: true },
      { label: "Thème sombre", disabled: true },
    ],
    "Paramètres": [
      { label: "Organisation", action: () => onNavigate("settings") },
      { label: "Équipe & rôles", action: () => onNavigate("team") },
      { divider: true },
      { label: "Plan comptable (SYCEBNL)", disabled: true },
      { label: "Modes de paiement", disabled: true },
      { label: "Notifications", disabled: true },
      { label: "Langue", disabled: true },
    ],
    "Outils": [
      { label: "Générateur de TDR", action: () => onNavigate("docs") },
      { label: "Journal comptable", action: () => onNavigate("journal") },
      { label: "Suivi des alertes flotte", action: () => onNavigate("fleet") },
      { label: "Gestion des chauffeurs", action: () => onNavigate("drivers") },
      { label: "Équipements & licences", action: () => onNavigate("equipment") },
      { divider: true },
      { label: "Journal d'audit", disabled: true },
      { label: "Import / export en masse", disabled: true },
    ],
    "Aide": [
      { label: "Raccourcis clavier", action: onShowShortcuts },
      { label: "À propos de Sahel Ops", action: onShowAbout },
      { divider: true },
      { label: "Contacter le support", action: () => window.open("mailto:support@sahelops.org") },
    ],
  };

  return (
    <div className="h-10 shrink-0 bg-white border-b border-[#E4E7EE] flex items-center px-3 gap-0.5">
      {Object.entries(menus).map(([label, items]) => (
        <Dropdown key={label} label={label} items={items} openMenu={openMenu} setOpenMenu={setOpenMenu} />
      ))}
      <div className="ml-auto flex items-center gap-2 pr-1">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1.5 text-xs text-[#9AA3B5] border border-[#E4E7EE] rounded-sm px-2 py-1 hover:bg-[#FAFBFC]"
        >
          Rechercher
          <kbd className="text-[10px] border border-[#E4E7EE] rounded px-1" style={mono}>Ctrl K</kbd>
        </button>
        {orgName && <span className="text-xs text-[#9AA3B5]">{orgName}</span>}
      </div>
    </div>
  );
}
