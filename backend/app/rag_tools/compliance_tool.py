"""Read-only tool binding: regulatory compliance posture."""

from __future__ import annotations


def get_compliance_score(org_id: str, framework: str) -> dict:
    """Calls compliance.framework_mapper.score_framework."""
    raise NotImplementedError("rag_tools.compliance_tool.get_compliance_score: pending Roadmap Phase 6")
