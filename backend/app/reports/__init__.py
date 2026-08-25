"""Audience-split reporting, layered on top of the existing app/reporting.py
technical-PDF generator (fpdf2 + matplotlib) rather than replacing it.

audit_evidence_report.py is the first of three planned splits (board,
executive, audit-evidence) and the one the PS most explicitly asks for:
"evidence-based reports... for audits, regulatory filings" means an export
path with a control-to-framework mapping table, gap list, and
RiskModelRun provenance hash for traceability — not just a percentage
score on a screen.
"""
