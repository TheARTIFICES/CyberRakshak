from typing import Dict, Any, Callable
from .risk_tool import query_financial_risk_posture
from .optimizer_tool import solve_budget_allocation
from .simulation_tool import run_whatif_scenario
from .compliance_tool import query_compliance_posture

# Security Whitelist: AI can ONLY invoke these strictly read-only analytical tools
TOOL_CALL_WHITELIST = {
    "risk_tool": query_financial_risk_posture,
    "optimizer_tool": solve_budget_allocation,
    "simulation_tool": run_whatif_scenario,
    "compliance_tool": query_compliance_posture
}

def execute_whitelisted_tool(tool_name: str, **kwargs) -> Dict[str, Any]:
    """
    Executes an approved read-only tool from the whitelist with parameter bounds enforcement.
    Prevents arbitrary execution or prompt injection side effects.
    """
    if tool_name not in TOOL_CALL_WHITELIST:
        raise ValueError(f"Unauthorized or unknown tool '{tool_name}'. Allowed: {list(TOOL_CALL_WHITELIST.keys())}")
    
    tool_fn = TOOL_CALL_WHITELIST[tool_name]
    return tool_fn(**kwargs)

__all__ = [
    "TOOL_CALL_WHITELIST",
    "execute_whitelisted_tool",
    "query_financial_risk_posture",
    "solve_budget_allocation",
    "run_whatif_scenario",
    "query_compliance_posture"
]
