import { useCallback, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import { clearSession, getStoredSession, storeSession } from "./api";
import "./mediaura.css";

const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

function App() {
  const [session, setSession] = useState(getStoredSession);
  const isAdminDashboardPath = window.location.pathname.replace(/\/+$/, "") === ADMIN_DASHBOARD_PATH;

  const handleAuthenticated = useCallback((nextSession) => {
    storeSession(nextSession);
    const destination = nextSession.user.role === "admin" ? ADMIN_DASHBOARD_PATH : "/";
    window.history.replaceState(null, "", destination);
    setSession(nextSession);
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    window.history.replaceState(null, "", "/");
    setSession(null);
  }, []);
  const signOutToAdminLogin = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  if (isAdminDashboardPath && !session) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }
  if (isAdminDashboardPath && session.user.role !== "admin") {
    return (
      <main className="admin-access">
        <section className="admin-access__card">
          <span className="eyebrow">Protected workspace</span>
          <h1>Administrator access required</h1>
          <p>This dashboard is available only to an authenticated administrator account.</p>
          <button className="button button--primary" onClick={signOutToAdminLogin} type="button">Sign out to use an admin account</button>
          <a className="button button--outline" href="/">Return to your workspace</a>
        </section>
      </main>
    );
  }

  return session
    ? <Dashboard key={session.user._id} onLogout={handleLogout} session={session} />
    : <AuthScreen onAuthenticated={handleAuthenticated} />;
}

export default App;
