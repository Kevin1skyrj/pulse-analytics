import { useEffect, useState, Suspense } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Activity,
  LayoutDashboard,
  ChartNoAxesCombined,
  Radio,
  Bell,
  Settings,
  Search,
  PanelLeftClose,
  Menu,
  Moon,
  Sun,
  ArrowUpRight,
} from "lucide-react";
import { Dialog } from "../components/ui";
import { usePreferences, updatePreferences } from "../state/preferences";

const routes = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/events", label: "Event explorer", icon: Activity },
  { path: "/live", label: "Live monitor", icon: Radio },
  { path: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/settings", label: "Settings", icon: Settings },
];
export default function Shell() {
  const preferences = usePreferences(),
    location = useLocation(),
    navigate = useNavigate();
  const [mobile, setMobile] = useState(false),
    [command, setCommand] = useState(false),
    [search, setSearch] = useState("");
  const current =
    routes.find((route) => route.path === location.pathname)?.label ||
    "Not found";
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.theme]);
  useEffect(() => {
    document.title = `${current} · Pulse`;
  }, [location.pathname, current]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommand((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const links = (
    <nav aria-label="Workspace navigation">
      {routes.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          onClick={() => setMobile(false)}
          title={label}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div
      className={`app-shell ${preferences.collapsed ? "sidebar-collapsed" : ""} ${preferences.compact ? "compact" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="Pulse overview">
          <Activity size={24} />
          <span>
            pulse<span className="accent">.</span>
          </span>
        </NavLink>
        <div className="workspace">
          <span className="workspace-avatar">A</span>
          <span>
            {preferences.workspace}
            <small>Engineering workspace</small>
          </span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        {links}
        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span>
            Local simulation<small>No production connection</small>
          </span>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="icon-button desktop-only"
              aria-label={
                preferences.collapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              onClick={() =>
                updatePreferences({ collapsed: !preferences.collapsed })
              }
            >
              <PanelLeftClose size={18} />
            </button>
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{current}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="command-trigger"
              onClick={() => setCommand(true)}
              aria-label="Open command palette"
            >
              <Search size={16} />
              <span>Search or jump to…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              aria-label={`Switch to ${preferences.theme === "dark" ? "light" : "dark"} theme`}
              onClick={() =>
                updatePreferences({
                  theme: preferences.theme === "dark" ? "light" : "dark",
                })
              }
            >
              {preferences.theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <span className="user-avatar" role="img" aria-label="Demo user RP">
              RP
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Suspense
            fallback={
              <div role="status" className="state">
                Opening workspace…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <footer className="app-footer">
          <span>
            Pulse workspace{" "}
            <span className="muted">/ Simulated operational data</span>
          </span>
          <span className="mono">SEED 20261024</span>
        </footer>
      </div>
      {mobile && (
        <Dialog title="Workspace navigation" onClose={() => setMobile(false)}>
          {links}
        </Dialog>
      )}
      {command && (
        <Dialog title="Jump to anything" onClose={() => setCommand(false)}>
          <label className="field">
            Search pages or event text
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try events, alerts, or a trace ID"
            />
          </label>
          <div className="command-list">
            {routes
              .filter((route) =>
                route.label.toLowerCase().includes(search.toLowerCase()),
              )
              .map((route) => (
                <button
                  key={route.path}
                  onClick={() => {
                    navigate(route.path);
                    setCommand(false);
                    setSearch("");
                  }}
                >
                  <route.icon size={18} />
                  {route.label}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            {search.trim() && (
              <button
                onClick={() => {
                  navigate(`/events?q=${encodeURIComponent(search.trim())}`);
                  setCommand(false);
                  setSearch("");
                }}
              >
                <Search size={18} />
                Search events for “{search}”
              </button>
            )}
          </div>
          <p className="muted text-xs">
            Tab to choose · Enter to open · Escape to close
          </p>
        </Dialog>
      )}
    </div>
  );
}
