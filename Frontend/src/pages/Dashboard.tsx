import React, { useState, useEffect } from "react";
import KpiCard from "../components/dashboard/KpiCard";
import GlobalRiskScore from "../components/dashboard/GlobalRiskScore";
import ExternalAttackSurface from "../components/dashboard/ExternalAttackSurface";
import AssetDistribution from "../components/dashboard/AssetDistribution";
import ContributingFactors from "../components/dashboard/ContributingFactors";
import CvssDistribution from "../components/dashboard/CvssDistribution";
import GeoThreatMap from "../components/dashboard/GeoThreatMap";
import RecentActivity from "../components/dashboard/RecentActivity";
import UnifiedCyberScore from "../components/dashboard/UnifiedCyberScore";
import AiInsightsPanel from "../components/dashboard/AiInsightsPanel";
import TotalSolutionsProvided from "../components/dashboard/TotalSolutionsProvided"; // <-- Import
import SpendCurveChart from "../components/risk/SpendCurveChart";
import EALTrendChart from "../components/risk/EALTrendChart";
import TopRiskDrivers from "../components/dashboard/TopRiskDrivers";
import { Bug, AlertTriangle, Flame, ShieldHalf, Radio, Gauge, Wallet, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";
import { getDashboardStats, getJobHistory, getRiskExposure, type RiskExposure } from "../services/api";
import { formatInrCompact } from "../utils/currency";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_vulnerabilities: 0,
    critical_findings: 0,
    high_findings: 0,
    medium_findings: 0,
    low_findings: 0,
    asset_criticality_score: 0,
    open_ports_detected: 0,
    unified_cyber_score: 0,
    total_assets: 0,
    internet_exposed: 0,
    high_risk_assets: 0,
    cloud_assets: 0,
    asset_distribution: {} as Record<string, number>
  });

  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [exposure, setExposure] = useState<RiskExposure | null>(null);
  const [exposureLoading, setExposureLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New state for the chart
  const [solutionTrend, setSolutionTrend] = useState<{ day: string; value: number }[]>([]);
  const [totalSolutions, setTotalSolutions] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          getDashboardStats(),
          getJobHistory(0, 50) // Fetch enough history to calculate trends
        ]);

        setStats(statsData);

        // 1. Process Recent Activity
        if (Array.isArray(jobsData)) {
          const mappedScans = jobsData.slice(0, 3).map((job: any) => ({
            tool: job.scanners_used?.[0] || "Unknown",
            target: job.target,
            status: job.status.charAt(0).toUpperCase() + job.status.slice(1)
          }));
          setRecentScans(mappedScans);

          // 2. Process "Total Solutions" Trend (Completed Scans over last 7 days)
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const today = new Date();
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return d;
          });

          // Initialize counters
          const trendMap = last7Days.reduce((acc, date) => {
            acc[date.toDateString()] = 0;
            return acc;
          }, {} as Record<string, number>);

          // Count completed jobs
          let completedCount = 0;
          jobsData.forEach((job: any) => {
            if (job.status === "completed" || job.status === "partial_success") {
              completedCount++;
              const jobDate = new Date(job.created_at).toDateString();
              if (trendMap[jobDate] !== undefined) {
                trendMap[jobDate]++;
              }
            }
          });

          setTotalSolutions(completedCount);

          // Format for chart
          const chartData = last7Days.map(date => ({
            day: days[date.getDay()],
            value: trendMap[date.toDateString()]
          }));
          setSolutionTrend(chartData);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setLoadError("Could not reach the backend — some figures below may be stale or unavailable.");
      }
    };

    fetchData();

    const fetchExposure = async () => {
      setExposureLoading(true);
      try {
        setExposure(await getRiskExposure());
      } catch (error) {
        console.error("Failed to fetch risk exposure:", error);
        setExposure(null);
        setLoadError("Could not reach the backend — some figures below may be stale or unavailable.");
      } finally {
        setExposureLoading(false);
      }
    };
    fetchExposure();
  }, []);

  return (
    <div className="space-y-6">

      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* MONEY-FIRST HERO — the headline is always a rupee figure, never a severity count */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Expected Annual Loss"
          value={exposureLoading ? "…" : formatInrCompact(exposure?.expected_annual_loss_inr ?? 0)}
          icon={Wallet}
          color="#dc2626"
          tooltip="The single most important number on this dashboard: modeled annual financial loss from the live FAIR risk engine (GET /api/risk/exposure)."
        />
        <KpiCard
          title="Value at Risk (95%)"
          value={exposureLoading ? "…" : formatInrCompact(exposure?.var_95_inr ?? 0)}
          icon={TrendingUp}
          color="#7c3aed"
          tooltip="95th-percentile annual loss from the Monte Carlo simulation — the tail-risk figure a CFO or board member cares about."
        />
        <KpiCard
          title="Enterprise Risk Score"
          value={exposureLoading ? "…" : `${exposure?.enterprise_risk_score ?? 0}/100`}
          icon={ShieldCheck}
          color="#059669"
          tooltip="Composite 0–100 posture score (100 = pristine, 0 = catastrophic). Replaces raw severity counts as the headline health metric."
        />
      </section>

      {/* QUANTITATIVE RISK & CAPITAL ALLOCATION SPEND FRONTIER */}
      <section>
        <EALTrendChart />
      </section>

      {/* Analyst-level breakdown behind the headline EAL — Dashboard-only,
          deliberately absent from Board Governance. */}
      <section>
        <TopRiskDrivers />
      </section>

      <section>
        <SpendCurveChart />
      </section>

      {/* TECHNICAL FINDINGS SUMMARY — demoted below the financial headline; still real, just not the lead story */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Technical Findings Summary
        </h2>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <KpiCard
            title="Total Vulnerabilities"
            value={stats.total_vulnerabilities.toLocaleString()}
            icon={Bug}
            color="#dc2626"
          />
          <KpiCard
            title="Critical Findings"
            value={stats.critical_findings.toLocaleString()}
            icon={AlertTriangle}
            color="#ea580c"
          />
          <KpiCard
            title="High Findings"
            value={stats.high_findings.toLocaleString()}
            icon={Flame}
            color="#f97316"
          />
          <KpiCard
            title="Asset Criticality Score"
            value={stats.asset_criticality_score.toLocaleString()}
            icon={ShieldHalf}
            color="#0ea5e9"
          />
          <KpiCard
            title="Open Ports Detected"
            value={stats.open_ports_detected.toLocaleString()}
            icon={Radio}
            color="#6366f1"
          />
          <KpiCard
            title="CyRa Score"
            value={stats.unified_cyber_score}
            icon={Gauge}
            color="#16a34a"
          />
        </section>
      </div>

      {/* MAIN WIDGET GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <GlobalRiskScore score={stats.unified_cyber_score} />
        </div>

        {/* Dynamic Solutions Chart */}
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <TotalSolutionsProvided data={solutionTrend} total={totalSolutions} />
        </div>

        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <ExternalAttackSurface stats={{
            total: stats.total_assets,
            exposed: stats.internet_exposed,
            cloud: stats.cloud_assets
          }} />
        </div>
      </section>

      {/* SECOND ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <AssetDistribution distribution={stats.asset_distribution} />
        </div>

        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <ContributingFactors />
        </div>

        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <CvssDistribution stats={{
            critical: stats.critical_findings,
            high: stats.high_findings,
            medium: stats.medium_findings,
            low: stats.low_findings
          }} />
        </div>
      </section>

      {/* GEO + RECENT DATA */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[360px]">
          <GeoThreatMap />
        </div>

        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[360px]">
          <RecentActivity recentScans={recentScans} />
        </div>
      </section>

      {/* UNIFIED CYBERSCORE + AI INSIGHTS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <UnifiedCyberScore score={stats.unified_cyber_score} />
        </div>
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-6 min-h-[260px]">
          <AiInsightsPanel />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
