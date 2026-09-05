"""
PDF report exporter using ReportLab with custom styling, tables,
page numbers, headers/footers, and compliance disclaimer.
"""
import os
from typing import Dict, Any

def export_to_pdf(calc_data: Dict[str, Any], output_path: str) -> str:
    """Exports calculation results to a formatted PDF document."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.pdfgen import canvas

        class NumberedCanvas(canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved_page_states = []

            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                num_pages = len(self._saved_page_states)
                for state in self._saved_page_states:
                    self.__dict__.update(state)
                    self.draw_page_decorations(num_pages)
                    super().showPage()
                super().save()

            def draw_page_decorations(self, page_count):
                self.saveState()
                self.setFont("Helvetica", 9)
                self.setFillColor(colors.HexColor("#64748B"))
                # Header
                self.drawString(54, 750, "TaxSetu Desktop Workstation - Statutory Income Tax Analysis")
                self.setStrokeColor(colors.HexColor("#CBD5E1"))
                self.setLineWidth(0.5)
                self.line(54, 742, 558, 742)

                # Footer
                page_text = f"Page {self._pageNumber} of {page_count}"
                self.drawRightString(558, 35, page_text)
                self.drawString(54, 35, "Confidential - For Educational & Planning Purposes Only")
                self.line(54, 48, 558, 48)
                self.restoreState()

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=64,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#1E3A8A"),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=14
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=12,
            spaceAfter=6
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1E293B")
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#0F172A")
        )
        disclaimer_style = ParagraphStyle(
            'DisclaimerText',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#B91C1C"),
            fontName="Helvetica-Oblique"
        )

        elements = []

        # Title
        elements.append(Paragraph("INDIAN INCOME-TAX COMPUTATION REPORT", title_style))
        elements.append(Paragraph(f"Generated On: {calc_data.get('timestamp', '')} | Offline System Verified", subtitle_style))
        elements.append(Spacer(1, 8))

        # Profile Table
        elements.append(Paragraph("1. Taxpayer Profile", h2_style))
        p_table_data = [
            [Paragraph("Taxpayer Name", cell_bold), Paragraph(calc_data.get("taxpayer_name", "N/A"), cell_style)],
            [Paragraph("Masked PAN", cell_bold), Paragraph(calc_data.get("pan_masked", "N/A"), cell_style)],
            [Paragraph("Governing Act", cell_bold), Paragraph(calc_data.get("act_name", "Income-tax Act, 1961"), cell_style)],
            [Paragraph("Regime & FY / AY", cell_bold), Paragraph(f"{calc_data.get('regime', 'New Regime')} | FY {calc_data.get('financial_year', '')} (AY {calc_data.get('assessment_year', '')})", cell_style)],
        ]
        t_profile = Table(p_table_data, colWidths=[160, 344])
        t_profile.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t_profile)
        elements.append(Spacer(1, 10))

        # Computation Breakdown Table
        elements.append(Paragraph("2. Tax Liability Computation Breakdown", h2_style))
        summary = calc_data.get("summary", {})
        c_table_data = [
            [Paragraph("Computation Head", cell_bold), Paragraph("Amount (INR)", cell_bold)],
            [Paragraph("Gross Total Income (GTI)", cell_style), Paragraph(f"Rs. {summary.get('gross_total_income', '0')}", cell_style)],
            [Paragraph("Less: Deductions & Exemptions", cell_style), Paragraph(f"Rs. {summary.get('total_deductions', '0')}", cell_style)],
            [Paragraph("Net Taxable Income", cell_bold), Paragraph(f"Rs. {summary.get('taxable_total_income', '0')}", cell_bold)],
            [Paragraph("Normal Slab Tax", cell_style), Paragraph(f"Rs. {summary.get('normal_slab_tax', '0')}", cell_style)],
            [Paragraph("Special Rate Tax (STCG 111A / LTCG 112A)", cell_style), Paragraph(f"Rs. {summary.get('special_rate_tax', '0')}", cell_style)],
            [Paragraph("Total Tax before Rebate", cell_style), Paragraph(f"Rs. {summary.get('tax_before_rebate', '0')}", cell_style)],
            [Paragraph("Less: Rebate u/s 87A", cell_style), Paragraph(f"Rs. {summary.get('rebate_amount', '0')}", cell_style)],
            [Paragraph("Tax after Rebate", cell_style), Paragraph(f"Rs. {summary.get('tax_after_rebate', '0')}", cell_style)],
            [Paragraph("Add: Surcharge", cell_style), Paragraph(f"Rs. {summary.get('surcharge_amount', '0')}", cell_style)],
            [Paragraph("Add: Health & Education Cess (4%)", cell_style), Paragraph(f"Rs. {summary.get('cess_amount', '0')}", cell_style)],
            [Paragraph("Total Tax Liability", cell_bold), Paragraph(f"Rs. {summary.get('total_tax_liability', '0')}", cell_bold)],
            [Paragraph("Less: Total Prepaid Taxes (TDS/Adv Tax)", cell_style), Paragraph(f"Rs. {summary.get('total_prepaid_tax', '0')}", cell_style)],
            [Paragraph("Net Balance Tax Payable / (Refund)", cell_bold), Paragraph(f"Rs. {summary.get('balance_tax_payable', '0')}", cell_bold)],
        ]
        t_comp = Table(c_table_data, colWidths=[340, 164])
        t_comp.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#EFF6FF")),
            ('BACKGROUND', (0, 11), (-1, 11), colors.HexColor("#F8FAFC")),
            ('BACKGROUND', (0, 13), (-1, 13), colors.HexColor("#FEF3C7")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_comp)
        elements.append(Spacer(1, 12))

        # Legal Disclaimer
        elements.append(Paragraph("Statutory Disclaimer", h2_style))
        elements.append(Paragraph(calc_data.get("disclaimer", ""), disclaimer_style))

        doc.build(elements, canvasmaker=NumberedCanvas)
        return output_path

    except ImportError:
        # Fallback to plain text if ReportLab is not present in local python env
        txt_path = output_path.replace(".pdf", ".txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(f"PDF EXPORT (Fallback text)\nGenerated: {calc_data.get('timestamp', '')}\n")
            f.write(f"Taxpayer: {calc_data.get('taxpayer_name', '')}\n")
            f.write(f"Disclaimer: {calc_data.get('disclaimer', '')}\n")
        return txt_path
