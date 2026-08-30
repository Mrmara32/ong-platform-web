import React, { useState } from "react";
import { login, register, setAuthToken } from "./lib/api";
import {
  Lock, Mail, Eye, EyeOff, Building2, Globe2, User,
  CheckCircle2, ArrowRight, LayoutDashboard, Wallet, Truck, ShieldCheck,
} from "lucide-react";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const VALUE_POINTS = [
  { icon: LayoutDashboard, text: "Planification, exécution et suivi de tous vos projets au même endroit" },
  { icon: Wallet, text: "Comptabilité SYCEBNL, budgets par ligne, paiements multicanal" },
  { icon: Truck, text: "Logistique complète : flotte, stocks, carburant, maintenance avec alertes" },
  { icon: ShieldCheck, text: "Isolation stricte des données entre organisations, partage maîtrisé" },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[46%] bg-[#101B33] text-white flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#1B2A4A] opacity-60" />
      <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-[#182642] opacity-50" />

      <div className="relative z-10">
        <div className="text-[#E8B564] font-semibold tracking-wide text-sm uppercase" style={mono}>Sahel Ops</div>
        <div className="text-xs text-[#8494B5] mt-1">Plateforme de gestion de projets</div>
      </div>

      <div className="relative z-10">
        <h1 className="text-3xl font-semibold leading-snug mb-3">
          La gestion de vos projets,<br />du terrain jusqu'au bailleur.
        </h1>
        <p className="text-sm text-[#9AA8C4] mb-8 max-w-sm">
          Une seule plateforme pour piloter vos projets, votre comptabilité,
          votre logistique et vos équipes — pensée pour les ONG et leurs partenaires.
        </p>
        <div className="space-y-4">
          {VALUE_POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-sm bg-[#1B2A4A] flex items-center justify-center">
                  <Icon size={14} className="text-[#E8B564]" />
                </div>
                <div className="text-sm text-[#C9D3E5]">{p.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 text-xs text-[#5C6987]">
        © 2026 Sahel Ops — Plateforme multi-organisations
      </div>
    </div>
  );
}

function TextField({ label, icon: Icon, type = "text", value, onChange, placeholder, hint }) {
  return (
    <div>
      <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">{label}</label>
      <div className="relative mt-1.5">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B7BFCE]" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-[#D8DCE6] rounded-md py-2.5 text-sm text-[#101B33] placeholder:text-[#B7BFCE] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-colors ${Icon ? "pl-9 pr-3" : "px-3"}`}
        />
      </div>
      {hint && <div className="text-xs text-[#9AA3B5] mt-1">{hint}</div>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">{label}</label>
      <div className="relative mt-1.5">
        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B7BFCE]" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-[#D8DCE6] rounded-md pl-9 pr-10 py-2.5 text-sm text-[#101B33] placeholder:text-[#B7BFCE] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7BFCE] hover:text-[#7A8399]"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <div className="text-xs text-[#9AA3B5] mt-1">{hint}</div>}
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="text-xs text-[#9B2C2C] bg-[#FDECEC] rounded-md px-3 py-2.5">{message}</div>;
}

// ---------------- Connexion ----------------

function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orgChoices, setOrgChoices] = useState(null);

  const submit = async (organizationId) => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password, organizationId);
      if (result.needsOrganizationChoice) {
        setOrgChoices(result.organizations);
        return;
      }
      setAuthToken(result.token);
      onLoggedIn(result);
    } catch (e) {
      setError("Email ou mot de passe incorrect. Vérifie tes identifiants et réessaie.");
    } finally {
      setLoading(false);
    }
  };

  if (orgChoices) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-[#3D4761] mb-3">Cette adresse est rattachée à plusieurs organisations. Laquelle veux-tu ouvrir ?</div>
        {orgChoices.map((o) => (
          <button
            key={o.id}
            onClick={() => submit(o.id)}
            className="w-full flex items-center justify-between text-left px-4 py-3 border border-[#D8DCE6] rounded-md text-sm hover:border-[#1B2A4A] hover:bg-[#FAFBFC] transition-colors"
          >
            <span className="text-[#101B33]">{o.name}</span>
            <span className="text-xs text-[#9AA3B5]">{o.role}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
      <TextField label="Email professionnel" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="prenom.nom@organisation.org" />
      <PasswordField label="Mot de passe" value={password} onChange={setPassword} placeholder="••••••••" />
      <ErrorBanner message={error} />
      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full flex items-center justify-center gap-2 bg-[#1B2A4A] text-white text-sm font-medium py-2.5 rounded-md hover:bg-[#233459] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Connexion en cours…" : "Se connecter"}
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  );
}

// ---------------- Inscription ----------------

const ORG_TYPES = [
  { value: "ONG", label: "ONG / Association" },
  { value: "BAILLEUR", label: "Bailleur de fonds" },
  { value: "PRESTATAIRE", label: "Prestataire / Consultant" },
  { value: "AUTRE", label: "Autre acteur du développement" },
];

function RegisterForm({ onLoggedIn }) {
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("ONG");
  const [country, setCountry] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const canSubmit = organizationName && country && fullName && email && password.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const result = await register({ organizationName, organizationType, country, fullName, email, password });
      setAuthToken(result.token);
      onLoggedIn(result);
    } catch (e) {
      const message = String(e.message || "");
      setError(
        message.includes("409") || message.toLowerCase().includes("existe déjà")
          ? "Un compte existe déjà avec cet email. Connecte-toi plutôt, ou utilise une autre adresse."
          : "Impossible de créer le compte pour l'instant. Vérifie les informations saisies et réessaie."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-[#9AA3B5]" />
          <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Votre organisation</div>
        </div>
        <div className="space-y-3">
          <TextField label="Nom de l'organisation" value={organizationName} onChange={setOrganizationName} placeholder="Ex. : ONG Sahel Ops" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Type</label>
              <select
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                className="w-full mt-1.5 border border-[#D8DCE6] rounded-md px-3 py-2.5 text-sm text-[#101B33] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-colors"
              >
                {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <TextField label="Pays" icon={Globe2} value={country} onChange={setCountry} placeholder="Ex. : Niger" />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#EEF0F4]" />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <User size={14} className="text-[#9AA3B5]" />
          <div className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Votre compte administrateur</div>
        </div>
        <div className="space-y-3">
          <TextField label="Nom complet" value={fullName} onChange={setFullName} placeholder="Ex. : Aïcha Ndiaye" />
          <TextField label="Email professionnel" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="prenom.nom@organisation.org" />
          <PasswordField
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            placeholder="8 caractères minimum"
            hint={passwordTooShort ? "Encore un peu court — 8 caractères minimum." : "8 caractères minimum."}
          />
        </div>
      </div>

      <ErrorBanner message={error} />

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full flex items-center justify-center gap-2 bg-[#1B2A4A] text-white text-sm font-medium py-2.5 rounded-md hover:bg-[#233459] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Création en cours…" : "Créer l'organisation"}
        {!loading && <ArrowRight size={15} />}
      </button>

      <p className="text-xs text-[#9AA3B5] text-center leading-relaxed">
        En créant un compte, tu deviens automatiquement Admin/Président de cette
        organisation et pourras y inviter tes collaborateurs.
      </p>
    </form>
  );
}

// ---------------- Écran racine ----------------

export default function LoginScreen({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // "login" | "register"

  return (
    <div className="min-h-screen flex bg-[#F5F6F9]">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-sm bg-[#101B33] flex items-center justify-center">
              <Lock size={14} className="text-[#E8B564]" />
            </div>
            <div className="text-[#101B33] font-semibold tracking-wide text-sm uppercase" style={mono}>Sahel Ops</div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-[#101B33]">
              {mode === "login" ? "Content de te revoir" : "Créer votre organisation"}
            </h2>
            <p className="text-sm text-[#7A8399] mt-1.5">
              {mode === "login"
                ? "Connecte-toi pour accéder à tes projets."
                : "Quelques informations pour démarrer — ça prend moins de deux minutes."}
            </p>
          </div>

          <div className="flex gap-1 p-1 bg-[#EEF0F4] rounded-md mb-7 max-w-xs">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${mode === "login" ? "bg-white text-[#101B33] shadow-sm font-medium" : "text-[#7A8399]"}`}
            >
              Se connecter
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${mode === "register" ? "bg-white text-[#101B33] shadow-sm font-medium" : "text-[#7A8399]"}`}
            >
              Créer un compte
            </button>
          </div>

          {mode === "login" ? <LoginForm onLoggedIn={onLoggedIn} /> : <RegisterForm onLoggedIn={onLoggedIn} />}

          <div className="mt-6 pt-5 border-t border-[#EEF0F4] flex items-center gap-2 text-xs text-[#9AA3B5]">
            <CheckCircle2 size={13} className="text-[#2F855A]" />
            Tes données restent isolées de celles des autres organisations de la plateforme.
          </div>
        </div>
      </div>
    </div>
  );
}
