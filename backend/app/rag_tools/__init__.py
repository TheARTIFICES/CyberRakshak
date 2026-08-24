"""CyRa tool-calling layer — strictly read-only.

When the intent classifier (app/intent_classifier.py) routes a financial
or what-if question, the LLM calls one of these typed functions instead of
generating from retrieved text — per the audit, this is non-negotiable for
correctness: "where should we invest 1 crore" has no answer in any
document, it's a live computation, and retrieval-only generation will
either be vague or fabricated.

Security allowlist: every tool callable here is read-only by construction
(no tool in this package may write, mutate, or trigger an action) —
ALLOWED_TOOLS below is the single source of truth the executor checks
against before dispatching an LLM-requested call. A tool that needs write
access (e.g. approving a mitigation) does not belong in this package.

Status: SCAFFOLD. Blocked on risk/, simulation/, compliance/ actually
computing something to expose. Roadmap Phase 6.
"""

from __future__ import annotations

ALLOWED_TOOLS: frozenset[str] = frozenset(
    {
        "get_eal",
        "get_var",
        "get_optimization_recommendation",
        "get_pareto_frontier",
        "run_scenario",
        "get_compliance_score",
    }
)


def execute_tool_call(tool_name: str, **kwargs):
    """Single dispatch point for every LLM-requested tool call. Rejects
    anything not in ALLOWED_TOOLS before it reaches a real function —
    this check must stay independent of whatever the LLM claims it wants
    to call.
    """
    if tool_name not in ALLOWED_TOOLS:
        raise PermissionError(f"tool not in read-only allowlist: {tool_name!r}")
    raise NotImplementedError("rag_tools.execute_tool_call: pending Roadmap Phase 6")
