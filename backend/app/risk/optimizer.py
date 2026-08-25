import pulp
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger("cyberrakshak.optimizer")

MIN_BUDGET_INR = 100000.0        # Minimum budget floor: ₹1 Lakh
MAX_BUDGET_INR = 100000000000.0  # Maximum budget ceiling: ₹10,000 Crore
SOLVER_TIMEOUT_SECONDS = 30      # 30-second solver timeout

def optimize_security_investments(
    actions: List[Dict[str, Any]],
    budget_inr: float,
    mandatory_control_ids: Optional[List[str]] = None,
    dependencies: Optional[List[Tuple[str, str]]] = None,
    time_limit_sec: int = SOLVER_TIMEOUT_SECONDS
) -> Dict[str, Any]:
    """
    Solves the Constrained Capital Allocation Problem using 0-1 Mixed Integer Linear Programming (MILP).
    
    Objective: Maximize total Expected Annual Loss reduction (Sum(Delta_EAL_i * x_i))
    Subject to:
    1. Budget constraint: Sum(Cost_i * x_i) <= Budget
    2. Dependency constraints: x_dep <= x_pre (Control B requires Control A)
    3. Mandatory regulatory controls: x_mandate == 1
    
    Security Controls:
    - Budget parameter sanitization with hard floor & ceiling.
    - Solver timeout limit to prevent CPU lockup.
    - Safe fallback if infeasible.
    """
    sanitized_budget = max(MIN_BUDGET_INR, min(MAX_BUDGET_INR, float(budget_inr)))
    
    if not actions:
        return {
            "selected_actions": [],
            "total_cost_inr": 0.0,
            "total_reduction_inr": 0.0,
            "overall_rosi": 0.0,
            "budget_utilized_pct": 0.0,
            "status": "No actions provided"
        }
        
    prob = pulp.LpProblem("CyberRakshak_Investment_Optimizer", pulp.LpMaximize)
    
    # Binary decision variables x_i in {0, 1}
    action_ids = [str(a.get("id", i)) for i, a in enumerate(actions)]
    action_map = {str(a.get("id", i)): a for i, a in enumerate(actions)}
    
    x = {aid: pulp.LpVariable(f"act_{aid}", cat="Binary") for aid in action_ids}
    
    # Objective Function: Maximize Loss Reduction in INR
    prob += pulp.lpSum([
        float(action_map[aid].get("estimated_reduction_inr", 0.0)) * x[aid]
        for aid in action_ids
    ]), "Total_EAL_Reduction"
    
    # 1. Budget Constraint
    prob += pulp.lpSum([
        float(action_map[aid].get("estimated_cost_inr", 0.0)) * x[aid]
        for aid in action_ids
    ]) <= sanitized_budget, "Budget_Cap"
    
    # 2. Mandatory Controls (e.g., statutory regulatory mandates)
    if mandatory_control_ids:
        for m_id in mandatory_control_ids:
            if str(m_id) in x:
                prob += x[str(m_id)] == 1, f"Mandatory_{m_id}"
                
    # 3. Control Dependencies (x_dep <= x_pre)
    if dependencies:
        for dep_id, pre_id in dependencies:
            if str(dep_id) in x and str(pre_id) in x:
                prob += x[str(dep_id)] <= x[str(pre_id)], f"Dep_{dep_id}_requires_{pre_id}"
                
    # Solve with time limit and suppressed stdout
    solver = pulp.PULP_CBC_CMD(msg=False, timeLimit=time_limit_sec)
    solve_status = prob.solve(solver)
    
    selected_actions = []
    total_cost = 0.0
    total_reduction = 0.0
    
    if solve_status == pulp.LpStatusOptimal or solve_status == 1:
        for aid in action_ids:
            var_val = pulp.value(x[aid])
            if var_val and var_val > 0.5:
                act = action_map[aid]
                selected_actions.append(act)
                total_cost += float(act.get("estimated_cost_inr", 0.0))
                total_reduction += float(act.get("estimated_reduction_inr", 0.0))
    else:
        logger.warning(f"PuLP solver finished with non-optimal status: {solve_status}")
        
    overall_rosi = (total_reduction - total_cost) / max(1.0, total_cost)
    budget_pct = (total_cost / sanitized_budget) * 100.0 if sanitized_budget > 0 else 0.0
    
    return {
        "selected_actions": selected_actions,
        "total_cost_inr": total_cost,
        "total_reduction_inr": total_reduction,
        "overall_rosi": overall_rosi,
        "budget_utilized_pct": min(100.0, budget_pct),
        "budget_limit_inr": sanitized_budget,
        "status": pulp.LpStatus[solve_status] if solve_status in pulp.LpStatus else "Solved"
    }

def generate_spend_curve(
    actions: List[Dict[str, Any]],
    max_budget_inr: float,
    steps: int = 10
) -> Dict[str, Any]:
    """
    Generates the Pareto Efficient Frontier spend curve across discrete budget points.
    Identifies the Knee Point (Optimal Spend Zone / Maximum Marginal ROSI).
    """
    if not actions or max_budget_inr <= 0:
        return {"curve_points": [], "knee_point": None}
        
    budget_step = max_budget_inr / steps
    curve_points = []
    best_marginal_rosi = -1.0
    knee_point = None
    prev_reduction = 0.0
    prev_cost = 0.0
    
    for i in range(1, steps + 1):
        target_budget = budget_step * i
        result = optimize_security_investments(actions, budget_inr=target_budget)
        cost = result["total_cost_inr"]
        reduction = result["total_reduction_inr"]
        rosi = result["overall_rosi"]
        
        marginal_cost = cost - prev_cost
        marginal_reduction = reduction - prev_reduction
        marginal_rosi = (marginal_reduction - marginal_cost) / max(1.0, marginal_cost) if marginal_cost > 0 else 0.0
        
        pt = {
            "budget_allocated_inr": target_budget,
            "actual_spend_inr": cost,
            "loss_reduction_inr": reduction,
            "overall_rosi": rosi,
            "marginal_rosi": marginal_rosi,
            "actions_count": len(result["selected_actions"])
        }
        curve_points.append(pt)
        
        if marginal_rosi > best_marginal_rosi and cost > 0:
            best_marginal_rosi = marginal_rosi
            knee_point = pt
            
        prev_reduction = reduction
        prev_cost = cost
        
    return {
        "curve_points": curve_points,
        "knee_point": knee_point or (curve_points[0] if curve_points else None)
    }
