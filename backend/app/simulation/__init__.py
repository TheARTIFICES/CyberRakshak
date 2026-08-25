"""Scenario Simulation Engine — the "what-if" layer the PS names
explicitly: MFA rollout, patch deployment, network segmentation, added
monitoring, delayed remediation, new ransomware campaign.

Deliberately reuses risk/engine.py and risk/uncertainty.py under a
parameter-override layer rather than a parallel calculation path — this is
what guarantees the simulator's numbers never disagree with the live
dashboard's. Requires no new math of its own; see engine.py first.

Status: SCAFFOLD, blocked on risk/ (Roadmap Phase 2/4) actually computing
something to override. Roadmap Phase 5.
"""
