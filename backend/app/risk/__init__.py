"""FAIR Quantitative Risk Management Engine.

Implements Factor Analysis of Information Risk (FAIR): converts technical
findings (CVSS, EPSS, exploit availability), control effectiveness, and
asset business value into monetary loss exposure (Expected Annual Loss,
Value at Risk) with a full audit trail.

Status: SCAFFOLD. Every module in this package defines its intended
interface and cites the governing formula, but the calculations themselves
are not yet implemented — see each module's docstring for what's pending.
This is Roadmap Phase 2 ("FAIR risk engine — full build") in
docs/audits/gap-audit.md. Nothing in this package should be imported by
request-handling code until that phase lands; api/risk.py routes should
return 501 Not Implemented until then rather than call into stubs silently.

Module map:
    impact.py       Single Loss Expectancy (SLE)
    likelihood.py   Annual Rate of Occurrence (threat x control effectiveness)
    engine.py       Orchestrator — combines impact + likelihood into EAL
    uncertainty.py  Monte Carlo simulation (Compound Poisson, N=10,000)
    optimizer.py    0-1 integer program for budget-constrained mitigation selection
    attack_path.py  Multi-hop chained-compromise exposure
    epss_client.py  FIRST.org EPSS exploit-prediction feed
    forecasting.py  EAL trend projection (30/60/90-day)
    provenance.py   Hashed, versioned audit trail for every computed figure
    score.py        0-100 normalized Enterprise Risk Score for dashboards
"""
