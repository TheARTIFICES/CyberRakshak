import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FlaskConical } from "lucide-react";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import ScenarioPicker from "../components/simulation/ScenarioPicker";
import ScenarioImpactPanel from "../components/simulation/ScenarioImpactPanel";
import {
  getSimulationScenarios,
  runScenarioSimulation,
  type ScenarioTemplate,
  type SimulationResult,
} from "../services/api";

/**
 * Scenario Simulator — what-if modeling against the live FAIR engine.
 *
 * Every scenario in the catalogue is executed once on mount so each card can
 * show its real baseline→projected impact without requiring a click. That also
 * makes selection instant: opening the full breakdown reads the already-fetched
 * result rather than issuing another POST /simulation/run.
 */
const ScenarioSimulator = () => {
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [previews, setPreviews] = useState<Record<string, SimulationResult>>({});
  const [previewsLoading, setPreviewsLoading] = useState(true);

  const [selected, setSelected] = useState<ScenarioTemplate | null>(null);

  const loadPreviews = useCallback(async (catalog: ScenarioTemplate[]) => {
    setPreviewsLoading(true);
    const settled = await Promise.allSettled(
      catalog.map((scenario) => runScenarioSimulation(scenario.id).then((r) => [scenario.id, r] as const))
    );

    const next: Record<string, SimulationResult> = {};
    settled.forEach((outcome) => {
      if (outcome.status === "fulfilled") {
        const [id, result] = outcome.value;
        next[id] = result;
      } else {
        console.error("Scenario preview failed:", outcome.reason);
      }
    });
    setPreviews(next);
    setPreviewsLoading(false);
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const data = await getSimulationScenarios();
        setScenarios(data);
        void loadPreviews(data);
      } catch (err) {
        console.error("Failed to load scenario catalog:", err);
        setCatalogError("Could not reach the simulation workbench.");
        setScenarios([]);
        setPreviewsLoading(false);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();
  }, [loadPreviews]);

  const selectedResult = selected ? previews[selected.id] : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenario Simulator"
        subtitle="Model the financial impact of a proposed change before committing budget — every figure comes from the same FAIR engine that powers the Dashboard, re-run against a hypothetical parameter set."
      />

      {catalogLoading && (
        <Card>
          <p className="text-sm text-slate-500 animate-pulse py-8 text-center">Loading scenario catalog…</p>
        </Card>
      )}

      {!catalogLoading && catalogError && (
        <Card>
          <EmptyState icon={AlertCircle} tone="error" title="Simulation workbench unavailable" description={catalogError} />
        </Card>
      )}

      {!catalogLoading && !catalogError && (
        <>
          <ScenarioPicker
            scenarios={scenarios}
            previews={previews}
            previewsLoading={previewsLoading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />

          {!selected ? (
            <Card>
              <EmptyState
                icon={FlaskConical}
                title="Select a scenario for the full breakdown"
                description="Each card above already shows its modeled impact. Choose one to see the baseline vs. projected comparison, ROSI, and the exact parameters applied."
              />
            </Card>
          ) : selectedResult ? (
            <ScenarioImpactPanel result={selectedResult} />
          ) : (
            <Card>
              <EmptyState
                icon={AlertCircle}
                tone="error"
                title="Simulation unavailable for this scenario"
                description="The FAIR engine did not return a result for this scenario. Try another, or reload the page."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ScenarioSimulator;
