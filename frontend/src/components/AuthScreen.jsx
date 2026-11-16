import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await apiRequest(`/auth/${mode}`, {
        method: "POST",
        body: form,
      });
      onAuthenticated({ user: result.user, token: result.token });
    } catch (requestError) {
      setError(requestError.message || "We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="MediAura introduction">
        <div className="auth-story__glow auth-story__glow--one" />
        <div className="auth-story__glow auth-story__glow--two" />
        <a className="brand brand--light" href="/" aria-label="MediAura home">
          <span className="brand__mark"><HeartPulse size={22} strokeWidth={2.2} /></span>
          <span className="brand__name">MediAura<span>.</span></span>
        </a>
        <div className="auth-story__copy">
          <span className="eyebrow eyebrow--light"><Sparkles size={14} /> A more thoughtful way to care</span>
          <h1>Care that feels<br />connected to you.</h1>
          <p>One calm place to find your doctor, manage appointments, and feel supported at every step.</p>
        </div>
        <div className="auth-story__panel">
          <div className="auth-story__pulse"><HeartPulse size={21} /></div>
          <div>
            <strong>Your health, in good hands.</strong>
            <span>Thoughtful care starts with a clear next step.</span>
          </div>
          <div className="auth-story__avatars" aria-hidden="true">
            <span>DR</span><span>AM</span><span>+</span>
          </div>
        </div>
        <div className="auth-story__foot">
          <span><ShieldCheck size={15} /> Private by design</span>
          <span><Check size={15} /> Care that stays connected</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__mobile-brand">
          <a className="brand" href="/" aria-label="MediAura home">
            <span className="brand__mark"><HeartPulse size={22} /></span>
            <span className="brand__name">MediAura<span>.</span></span>
          </a>
        </div>
        <div className="auth-card">
          <div className="auth-card__intro">
            <span className="eyebrow">{isRegister ? "A healthier routine starts here" : "Welcome to your care space"}</span>
            <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
            <p>{isRegister ? "Join MediAura to make your next appointment feel simple." : "Sign in to pick up right where your care left off."}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="field">
                <span>Full name</span>
                <input autoComplete="name" name="name" onChange={updateField} placeholder="How should we address you?" required value={form.name} />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input autoComplete="email" name="email" onChange={updateField} placeholder="you@example.com" required type="email" value={form.email} />
            </label>
            <label className="field">
              <span>Password</span>
              <input autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : undefined} name="password" onChange={updateField} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} required type="password" value={form.password} />
            </label>

            {error && <div className="form-alert" role="alert">{error}</div>}
            <button className="button button--primary button--wide auth-submit" disabled={busy} type="submit">
              {busy ? <span className="spinner" /> : <>{isRegister ? "Create patient account" : "Sign in to MediAura"} <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-note"><CircleHelp size={15} /><span>Doctor and administrator accounts are created by your clinic.</span></div>
          <p className="auth-disclaimer">By continuing, you agree to use MediAura for appointment coordination. It is not a substitute for professional medical advice.</p>
        </div>
        <span className="auth-panel__copyright">© 2026 MediAura Health</span>
      </section>
    </main>
  );
}
