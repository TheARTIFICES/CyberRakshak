"""Auditor-facing evidence export.

Must be usable by an actual auditor, not just readable by an internal
team: control-to-framework mapping table, gap list per compliance/
framework_mapper.py, and the RiskModelRun provenance hash for every cited
figure so a reviewer can trace a number back to its exact computation.

Status: SCAFFOLD. Depends on compliance/ (Roadmap Phase 7) and risk/
provenance.py (Roadmap Phase 2) both existing first — this module is
pure presentation over their output, not a new source of truth.
"""

from __future__ import annotations


def generate_audit_evidence_pdf(org_id: str, framework: str) -> bytes:
    """Returns PDF bytes via fpdf2, reusing app/reporting.py's existing
    layout helpers rather than duplicating PDF-building logic.
    """
    raise NotImplementedError("reports.audit_evidence_report.generate_audit_evidence_pdf: pending Roadmap Phase 7")
