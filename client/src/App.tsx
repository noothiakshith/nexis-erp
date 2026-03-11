import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DashboardV2 from "./pages/DashboardV2";
import Finance from "./pages/Finance";
import HR from "./pages/HR";
import Inventory from "./pages/Inventory";
import CRM from "./pages/CRM";
import Projects from "./pages/Projects";
import Procurement from "./pages/Procurement";
import Analytics from "./pages/Analytics";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Approvals from "./pages/Approvals";
import FinancialAnalytics from "./pages/FinancialAnalytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import ScheduledReports from "./pages/ScheduledReports";
import ProjectDetails from "./pages/ProjectDetails";
import LeadDetails from "./pages/LeadDetails";
import RealMLDemo from "./pages/RealMLDemo";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={DashboardV2} />
      <Route path={"/dashboard-v1"} component={Dashboard} />
      <Route path={"/finance"} component={Finance} />
      <Route path={"/hr"} component={HR} />
      <Route path={"/inventory"} component={Inventory} />
      <Route path={"/crm"} component={CRM} />
      <Route path={"/crm/leads/:id"} component={LeadDetails} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/projects/:id"} component={ProjectDetails} />
      <Route path={"/procurement"} component={Procurement} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/documents"} component={Documents} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/approvals"} component={Approvals} />
      <Route path={"/financial-analytics"} component={FinancialAnalytics} />
      <Route path={"/advanced-analytics"} component={AdvancedAnalytics} />
      <Route path={"/predictive-analytics"} component={PredictiveAnalytics} />
      <Route path={"/scheduled-reports"} component={ScheduledReports} />
      <Route path={"/real-ml"} component={RealMLDemo} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
