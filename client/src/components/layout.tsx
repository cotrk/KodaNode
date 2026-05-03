import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Sparkles,
  PenTool,
  LayoutTemplate,
  History,
  Layers,
  Menu,
  Settings,
  Wrench,
} from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toolItems = [
    { href: "/create", icon: Sparkles, label: "Create Persona" },
    { href: "/refactor", icon: PenTool, label: "Refactor Prompt" },
    { href: "/template", icon: LayoutTemplate, label: "Template Builder" },
  ];

  const configItems = [
    { href: "/mcp", icon: Wrench, label: "MCP Servers" },
    { href: "/settings", icon: Settings, label: "AI Providers" },
  ];

  const isActive = (href: string) =>
    location === href || (location === "/" && href === "/create");

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/30 overflow-hidden relative">
      {/* Ambient background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 glass-panel border-y-0 border-l-0 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-xl leading-tight text-gradient">Persona</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Architect</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tools</div>
          {toolItems.map((item) => (
            <Link key={item.href} href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground border border-transparent"
              }`}>
              <item.icon className={`w-5 h-5 transition-colors ${isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          <div className="px-3 pt-6 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Library</div>
          <Link href="/history" onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              location.startsWith("/history")
                ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground border border-transparent"
            }`}>
            <History className={`w-5 h-5 transition-colors ${location.startsWith("/history") ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="font-medium">History</span>
          </Link>

          <div className="px-3 pt-6 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Configuration</div>
          {configItems.map((item) => (
            <Link key={item.href} href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.startsWith(item.href)
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground border border-transparent"
              }`}>
              <item.icon className={`w-5 h-5 transition-colors ${location.startsWith(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="bg-secondary/50 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Powered by Ollama &amp; MCP. Configure providers and tool servers above.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 glass-panel border-x-0 border-t-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-sans font-bold text-lg text-gradient">Persona Architect</h1>
          </div>
          <button onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </div>
      </main>
    </div>
  );
}
