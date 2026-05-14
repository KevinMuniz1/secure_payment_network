import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transfer", label: "Transfer" },
  { to: "/security", label: "Security" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Fixed top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 h-16">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#d4af37" }}
            >
              <span className="text-xs font-bold text-zinc-950">V</span>
            </div>
            <span className="text-white font-semibold tracking-wide text-sm">
              Vault
            </span>
          </div>

          {/* Right side: nav links + divider + email + logout */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    isActive
                      ? "text-white text-sm transition-colors"
                      : "text-zinc-400 hover:text-white text-sm transition-colors"
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="w-px h-4 bg-zinc-700" />

            <span className="text-zinc-500 text-sm">{user?.email}</span>

            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content below nav */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
