import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, PenTool, LayoutTemplate, BookOpen, Bot, Settings, Wrench, Library, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";

interface LayoutProps { children: ReactNode; }

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(
    ["/create", "/refactor", "/template", "/"].includes(location) || location === "/"
  );

  const isActive = (href: string) =>
    location === href || (location === "/" && href === "/create");

  const isCreateSection = ["/create", "/refactor", "/template"].includes(location) || location === "/";

  const navLink = (href: string, Icon: typeof Sparkles, label: string, sub = false) => (
    <Link key={href} href={href} onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${sub ? "ml-3" : ""}
        ${isActive(href)
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-foreground/65 hover:bg-secondary/80 hover:text-foreground border border-transparent"
        }`}>
      <Icon className={`w-4 h-4 shrink-0 ${isActive(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
      <span className={`font-medium ${sub ? "text-sm" : ""}`}>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/8 rounded-full blur-[100px] pointer-events-none -z-10" />

      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-68 glass-panel border-y-0 border-l-0 flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `} style={{ width: "17rem" }}>

        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Library className="w-4.5 h-4.5 text-white" style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg leading-tight text-gradient">Prompt Vault</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">AI Prompt Library</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto custom-scrollbar">

          {/* Library — primary nav item */}
          <Link href="/library" onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-2 ${
              location.startsWith("/library")
                ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                : "text-foreground/80 hover:bg-secondary/80 hover:text-foreground border border-transparent"
            }`}>
            <BookOpen className={`w-5 h-5 shrink-0 ${location.startsWith("/library") ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="font-semibold">My Library</span>
          </Link>

          {/* AI Assistant */}
          <Link href="/assistant" onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-2 ${
              location === "/assistant"
                ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                : "text-foreground/80 hover:bg-secondary/80 hover:text-foreground border border-transparent"
            }`}>
            <Bot className={`w-5 h-5 shrink-0 ${location === "/assistant" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="font-semibold">AI Assistant</span>
          </Link>

          <div className="border-t border-border/30 my-3" />

          {/* Create section (collapsible) */}
          <button onClick={() => setCreateOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all group">
            <span className="text-xs font-semibold uppercase tracking-widest">Create</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${createOpen ? "rotate-180" : ""}`} />
          </button>

          {createOpen && (
            <div className="space-y-0.5 pt-1">
              {navLink("/create", Sparkles, "Persona Architect", true)}
              {navLink("/refactor", PenTool, "Refactor Prompt", true)}
              {navLink("/template", LayoutTemplate, "Template Builder", true)}
            </div>
          )}

          <div className="border-t border-border/30 my-3" />

          {/* Configuration */}
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Configuration</div>
          {navLink("/mcp", Wrench, "MCP Servers")}
          {navLink("/settings", Settings, "AI Providers")}
        </nav>

        <div className="p-3 border-t border-border/50">
          <div className="bg-secondary/40 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Powered by Ollama & MCP. All prompts saved locally.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 glass-panel border-x-0 border-t-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <Library className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-sans font-bold text-lg text-gradient">Prompt Vault</h1>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-secondary text-foreground">
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">{children}</div>
      </main>
    </div>
  );
}
