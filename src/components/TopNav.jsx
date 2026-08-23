import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Settings, ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

export default function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="group">
            <Logo />
          </button>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors rounded-md ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label.toUpperCase()}
                    {isActive && (
                      <span className="absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] bg-accent rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
            <button className="relative w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center transition-colors">
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.6} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            <button
              onClick={() => navigate("/configuracoes")}
              className="w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 flex items-center justify-center transition-colors"
            >
              <Settings className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-md hover:bg-secondary/70 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-semibold border border-border">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-[12px] font-medium text-foreground max-w-[120px] truncate">
                    {user?.full_name || "Usuário"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Advogado(a)</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-lg shadow-xl py-1.5 z-50">
                    <button
                      onClick={() => { setMenuOpen(false); navigate("/configuracoes"); }}
                      className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-secondary/70"
                    >
                      Configurações
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); logout && logout(); }}
                      className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-secondary/70 border-t border-border mt-1"
                    >
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="lg:hidden flex items-center gap-1 overflow-x-auto scrollbar-thin pb-2 -mt-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 text-[12px] font-medium tracking-wide rounded-md ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/70"
                }`
              }
            >
              {item.label.toUpperCase()}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}