import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import CreatePersona from "@/pages/create";
import RefactorPrompt from "@/pages/refactor";
import TemplateBuilder from "@/pages/template";
import Library from "@/pages/library";
import LibraryDetail from "@/pages/library-detail";
import Assistant from "@/pages/assistant";
import SettingsPage from "@/pages/settings";
import McpManager from "@/pages/mcp-manager";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Library} />
        <Route path="/library" component={Library} />
        <Route path="/library/:id" component={LibraryDetail} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/create" component={CreatePersona} />
        <Route path="/refactor" component={RefactorPrompt} />
        <Route path="/template" component={TemplateBuilder} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/mcp" component={McpManager} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
