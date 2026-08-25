import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FlaskConical } from "lucide-react";
import ScenarioPicker from "../components/simulation/ScenarioPicker";
import ScenarioImpactPanel from "../components/simulation/ScenarioImpactPanel";
import {
  getSimulationScenarios,
  runScenarioSimulation,
  type ScenarioTemplate,
  type SimulationResult,
} from "../services/api";

/**
 * Scenario Simulator — before/after EAL & VaR comparison for named what-if
 * scenarios (MFA rollout, patch deployment, segmentation, delayed
 * remediation, a new campaign). Calls the same FAIR engine as the live
 * dashboard (backend/app/risk/engine.py::calculate_asset_fair_risk) with
 * scenario-overridden parameters via POST /api/simulation/run, so this
 * screen's numbers can never disagree with the dashboard's.
 */
const ScenarioSimulator = () => {
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ScenarioTemplate | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const data = await getSimulationScenarios();
        setScenarios(data);
      } catch (err) {
        console.error("Failed to load scenario catalog:", err);
        setCatalogError("Could not reach the simulation workbench.");
        setScenarios([]);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSelect = useCallback(async (scenario: ScenarioTemplate) => {
    setSelected(scenario);
    setRunning(true);
    setRunError(null);
    try {
      const res = await runScenarioSimulation(scenario.id);
      setResult(res);
    } catch (err) {
      console.error(`Failed to run scenario ${scenario.id}:`, err);
      setRunError("Simulation failed — the FAIR risk engine may be unavailable.");
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scenario Simulator</h1>
        <p className="opacity-70 text-sm">
          Model the financial impact of a proposed change before committing budget to it — every number below comes
          from the same FAIR engine that powers the live dashboard, re-run against a hypothetical parameter set.
        </p>
      </div>

      {catalogLoading && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Loading scenario catalog…</p>
        </div>
      )}

      {!catalogLoading && catalogError && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex flex-col items-center text-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-slate-500 max-w-sm">{catalogError}</p>
        </div>
      )}

      {!catalogLoading && !catalogError && (
        <>
          <ScenarioPicker
            scenarios={scenarios}
            selectedId={selected?.id ?? null}
            runningId={running ? selected?.id ?? null : null}
            onSelect={handleSelect}
          />

          {!selected && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex flex-col items-center text-center gap-3">
              <FlaskConical className="w-10 h-10 text-purple-500" />
              <h2 className="text-lg font-semibold">Pick a scenario to simulate</h2>
              <p className="text-sm opacity-70 max-w-md">
                Each card above is a real proposed change. Selecting one re-solves the FAIR engine against your
                current asset and vulnerability baseline with that scenario's parameter overrides applied.
              </p>
            </div>
          )}

          {selected && running && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex items-center justify-center">
              <p className="text-sm text-slate-500 animate-pulse">
                Re-solving FAIR risk for "{selected.name}"…
              </p>
            </div>
          )}

          {selected && !running && runError && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-10 flex flex-col items-center text-center gap-2">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-slate-500 max-w-sm">{runError}</p>
            </div>
          )}

          {selected && !running && !runError && result && <ScenarioImpactPanel result={result} />}
        </>
      )}
    </div>
  );
};

export default ScenarioSimulator;
