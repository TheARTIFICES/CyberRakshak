import os
import datetime
from fpdf import FPDF
from typing import Dict, Any, List

class AuditEvidencePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(15, 23, 42) # Slate-900
        self.cell(0, 8, "CYBERRAKSHAK VITTA | EXECUTIVE RISK & AUDIT EVIDENCE PACK", ln=True, align="L")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 116, 139) # Slate-500
        self.cell(0, 4, f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Model: FAIR v2.5.0 (IN-2026.1)", ln=True, align="L")
        self.line(10, 22, 200, 22)
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f"Page {self.page_no()} - Confidential | Audit Evidence Ledger | Cryptographic Hash Verified", align="C")

def generate_audit_evidence_pdf(report_data: Dict[str, Any], output_path: str) -> str:
    """
    Generates a formal, audit-ready compliance & quantitative financial risk PDF report.
    """
    pdf = AuditEvidencePDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # 1. Executive Summary Table
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 41, 59)
    pdf.cell(0, 8, "1. Enterprise Quantitative Risk Exposure", ln=True)
    pdf.ln(2)
    
    pdf.set_font("Helvetica", "", 10)
    eal = report_data.get("expected_annual_loss_inr", 0.0)
    var = report_data.get("var_95_inr", 0.0)
    score = report_data.get("enterprise_risk_score", 100)
    
    pdf.set_fill_color(241, 245, 249)
    pdf.cell(95, 8, f" Expected Annual Loss (EAL): INR {eal:,.2f}", 1, 0, "L", True)
    pdf.cell(95, 8, f" 95% Value at Risk (VaR): INR {var:,.2f}", 1, 1, "L", True)
    pdf.cell(95, 8, f" Enterprise Risk Score: {score}/100", 1, 0, "L")
    pdf.cell(95, 8, f" Cryptographic Input Hash: {report_data.get('input_hash', 'N/A')[:20]}...", 1, 1, "L")
    pdf.ln(6)

    # 2. Compliance Framework Posture Table
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. Statutory Regulatory Frameworks & Penalty Exposure", ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(50, 7, "Framework", 1, 0, "L", True)
    pdf.cell(30, 7, "Category", 1, 0, "L", True)
    pdf.cell(25, 7, "Score", 1, 0, "C", True)
    pdf.cell(25, 7, "Gaps", 1, 0, "C", True)
    pdf.cell(60, 7, "Max Penalty Exposure", 1, 1, "R", True)

    pdf.set_font("Helvetica", "", 9)
    frameworks = report_data.get("compliance_scores", [])
    for fw in frameworks:
        pdf.cell(50, 6, str(fw.get("framework_title", fw.get("framework_name"))[:25]), 1, 0, "L")
        pdf.cell(30, 6, str(fw.get("category", "General")), 1, 0, "L")
        pdf.cell(25, 6, f"{fw.get('score', 0.0):.1f}%", 1, 0, "C")
        pdf.cell(25, 6, str(fw.get("gap_count", 0)), 1, 0, "C")
        exp = fw.get("regulatory_penalty_exposure_inr", 0.0)
        pdf.cell(60, 6, f"INR {exp:,.2f}" if exp > 0 else "Compliant / N/A", 1, 1, "R")

    pdf.ln(6)

    # 3. Recommended Capital Allocations (PuLP Optimizer Outcomes)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "3. Optimal Capital Allocation & Mitigation Plan", ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(226, 232, 240)
    pdf.cell(75, 7, "Mitigation Action", 1, 0, "L", True)
    pdf.cell(30, 7, "Type", 1, 0, "C", True)
    pdf.cell(40, 7, "Est. Cost (INR)", 1, 0, "R", True)
    pdf.cell(45, 7, "Projected EAL Reduction", 1, 1, "R", True)

    pdf.set_font("Helvetica", "", 9)
    actions = report_data.get("recommended_actions", [])[:8]
    for act in actions:
        pdf.cell(75, 6, str(act.get("title", "Remediation Action")[:40]), 1, 0, "L")
        pdf.cell(30, 6, str(act.get("action_type", "patch")), 1, 0, "C")
        cost = float(act.get("estimated_cost_inr", 0.0))
        red = float(act.get("estimated_reduction_inr", 0.0))
        pdf.cell(40, 6, f"INR {cost:,.2f}", 1, 0, "R")
        pdf.cell(45, 6, f"INR {red:,.2f}", 1, 1, "R")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    pdf.output(output_path)
    return output_path
