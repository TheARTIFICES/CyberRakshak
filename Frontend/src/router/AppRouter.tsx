// Router configuration for CyberRakshak platform
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import AuditLogs from "../pages/AuditLogs";
import Dashboard from "../pages/Dashboard";
import ScanConsole from "../pages/ScanConsole";
import Vulnerabilities from "../pages/Vulnerabilities";
import Assets from "../pages/Assets";
import AttackPath from "../pages/AttackPath";
import ThreatIntel from "../pages/ThreatIntel";
import Reports from "../pages/Reports";

import ChatAssistant from "../pages/ChatAssistant";
import Settings from "../pages/Settings";
import UserProfile from "../pages/UserProfile";
import GraphSnapshot from "../pages/GraphSnapshot";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan-console" element={<ScanConsole />} />
          <Route path="/vulnerabilities" element={<Vulnerabilities />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/attack-path" element={<AttackPath />} />
          <Route path="/threat-intel" element={<ThreatIntel />} />
          <Route path="/reports" element={<Reports />} />

          <Route path="/assistant" element={<ChatAssistant />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
	<Route path="/graph-snapshot/:jobId" element={<GraphSnapshot />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
