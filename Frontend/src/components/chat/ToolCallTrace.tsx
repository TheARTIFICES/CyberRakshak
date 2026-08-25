import { useState } from "react";
import { ChevronDown, ChevronRight, Cpu } from "lucide-react";
import type { ToolCall } from "../../services/api";

/**
 * "How this was calculated" — the copilot's trust surface.
 *
 * Renders the deterministic tool calls behind an answer: which risk/optimizer/
 * simulation/compliance function ran, with what parameters, and what it
 * returned. This is what separates a narrated figure from a hallucinated one.
 *
 * IMPORTANT: this component renders only when the chat response actually
 * carries a `tool_calls` payload. The backend does not emit one today —
 * ChatMessageResponse is `{ response: str }` and no tool_calls field exists
 * anywhere in backend/app — so nothing is shown rather than a fabricated
 * trace. Faking this particular panel would undermine the exact property it
 * exists to demonstrate.
 *
 * Contract required from the AI/tool-calling work to light this up:
 *   POST /api/chat/message -> {
 *     response: string,
 *     tool_calls?: [{ tool: string, parameters: object, result: object,
 *                     duration_ms?: number }]
 *   }
 */
const ToolCallTrace = ({ toolCalls }: { toolCalls?: ToolCall[] }) => {
  const [open, setOpen] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Cpu className="w-3.5 h-3.5" />
        How this was calculated
        <span className="text-slate-400 font-normal">
          ({toolCalls.length} deterministic call{toolCalls.length === 1 ? "" : "s"})
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {toolCalls.map((call, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {call.tool}
                </span>
                {call.duration_ms != null && (
                  <span className="text-[11px] text-slate-400">{call.duration_ms} ms</span>
                )}
              </div>

              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Parameters</p>
              <pre className="text-[11px] bg-white dark:bg-slate-950 rounded p-2 overflow-x-auto text-slate-600 dark:text-slate-300 mb-2">
                {JSON.stringify(call.parameters, null, 2)}
              </pre>

              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Returned</p>
              <pre className="text-[11px] bg-white dark:bg-slate-950 rounded p-2 overflow-x-auto text-slate-600 dark:text-slate-300">
                {JSON.stringify(call.result, null, 2)}
              </pre>
            </div>
          ))}

          <p className="text-[11px] text-slate-400">
            Figures above are computed by the deterministic risk engine. The assistant narrates them; it does not
            calculate them.
          </p>
        </div>
      )}
    </div>
  );
};

export default ToolCallTrace;
