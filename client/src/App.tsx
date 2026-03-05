import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components & Pages
import { Layout } from "@/components/layout";
import CreatePersona from "@/pages/create";
import RefactorPrompt from "@/pages/refactor";
import TemplateBuilder from "@/pages/template";
import History from "@/pages/history";
import HistoryDetail from "@/pages/history-detail";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Base route defaults to Create */}
        <Route path="/" component={CreatePersona} />
        
        {/* Modes */}
        <Route path="/create" component={CreatePersona} />
        <Route path="/refactor" component={RefactorPrompt} />
        <Route path="/template" component={TemplateBuilder} />
        
        {/* History */}
        <Route path="/history" component={History} />
        <Route path="/history/:id" component={HistoryDetail} />
        
        {/* Fallback to 404 */}
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
