// Router configuration for CyberRakshak platform
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { LandingLayout } from "../layouts/LandingLayout";
import HomePage from "../pages/HomePage";
import AuditLogs from "../pages/AuditLogs";
import Dashboard from "../pages/Dashboard";
import ScanConsole from "../pages/ScanConsole";
import Vulnerabilities from "../pages/Vulnerabilities";
import Assets from "../pages/Assets";
import AttackPath from "../pages/AttackPath";
import ThreatIntel from "../pages/ThreatIntel";
import Reports from "../pages/Reports";
import Remediation from "../pages/Remediation";
import ChatAssistant from "../pages/ChatAssistant";
import Settings from "../pages/Settings";
import UserProfile from "../pages/UserProfile";
import GraphSnapshot from "../pages/GraphSnapshot";
import BoardPortal from "../pages/BoardPortal";
import ScenarioSimulator from "../pages/ScenarioSimulator";
import ComplianceCenter from "../pages/ComplianceCenter";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
        </Route>

        {/* Operational Security Portal */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/board-portal" element={<BoardPortal />} />
          <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
          <Route path="/compliance-center" element={<ComplianceCenter />} />
          <Route path="/scan-console" element={<ScanConsole />} />
          <Route path="/vulnerabilities" element={<Vulnerabilities />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/attack-path" element={<AttackPath />} />
          <Route path="/threat-intel" element={<ThreatIntel />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/remediation" element={<Remediation />} />
          <Route path="/assistant" element={<ChatAssistant />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>

        {/* Headless Snapshot Route */}
        <Route path="/graph-snapshot/:jobId" element={<GraphSnapshot />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
