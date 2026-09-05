import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { AdvanceTaxResult, TDSResult } from '../types';

export function exportAdvanceTaxToExcel(data: AdvanceTaxResult) {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['INDIAN INCOME-TAX COMPUTATION REPORT'],
    ['Generated On', data.timestamp],
    ['Governing Act', data.act_name],
    ['Regime', data.regime],
    ['Financial Year', data.financial_year],
    ['Assessment Year', data.assessment_year],
    ['Taxpayer Name', data.taxpayer_name],
    ['Masked PAN', data.pan_masked],
    ['Taxpayer Category', data.taxpayer_category],
    [],
    ['COMPUTATION HEAD', 'AMOUNT (INR)'],
    ['Gross Total Income (GTI)', data.summary.gross_total_income],
    ['Less: Total Deductions', data.summary.total_deductions],
    ['Net Taxable Total Income', data.summary.taxable_total_income],
    ['Normal Slab Tax', data.summary.normal_slab_tax],
    ['Special Rate Tax (STCG 111A / LTCG 112A)', data.summary.special_rate_tax],
    ['Tax Payable before Rebate', data.summary.tax_before_rebate],
    ['Less: Rebate u/s 87A', data.summary.rebate_amount],
    ['Tax after Rebate', data.summary.tax_after_rebate],
    ['Add: Surcharge', data.summary.surcharge_amount],
    ['Add: Health & Education Cess (4%)', data.summary.cess_amount],
    ['Total Tax Liability (Rounded u/s 288B)', data.summary.total_tax_liability],
    ['Less: Total Prepaid Taxes (TDS / Advance Tax)', data.summary.total_prepaid_tax],
    ['Balance Tax Payable / (Refund)', data.summary.balance_tax_payable],
    ['Advance Tax Mandatory u/s 208?', data.summary.is_advance_tax_applicable ? 'YES' : 'NO'],
    [],
    ['STATUTORY COMPLIANCE DISCLAIMER'],
    [data.disclaimer]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Computation Summary');

  // Slab Breakdown Sheet
  if (data.slab_breakdown && data.slab_breakdown.length > 0) {
    const slabRows = [
      ['Income Slab Range', 'Tax Rate', 'Taxable Amount (INR)', 'Tax in Slab (INR)', 'Rule Reference'],
      ...data.slab_breakdown.map(s => [s.range, s.rate, s.taxable_amount, s.tax, s.rule_source])
    ];
    const wsSlabs = XLSX.utils.aoa_to_sheet(slabRows);
    XLSX.utils.book_append_sheet(wb, wsSlabs, 'Slab Breakdown');
  }

  // Instalment Schedule Sheet
  if (data.instalment_schedule && data.instalment_schedule.length > 0) {
    const instRows = [
      ['Instalment', 'Due Date', 'Cumulative %', 'Required Cumulative (INR)', 'Paid Up To Date (INR)', 'Shortfall (INR)', 'Status'],
      ...data.instalment_schedule.map(i => [
        `Instalment ${i.instalment_number}`,
        i.due_date,
        `${i.cumulative_percent}%`,
        i.required_cumulative_amount,
        i.paid_up_to_date,
        i.shortfall,
        i.status.toUpperCase()
      ])
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instRows);
    XLSX.utils.book_append_sheet(wb, wsInst, 'Advance Tax Schedule');
  }

  XLSX.writeFile(wb, `Tax_Computation_${data.pan_masked}_${data.financial_year}.xlsx`);
}

export function exportAdvanceTaxToPDF(data: AdvanceTaxResult) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text('INDIAN INCOME-TAX COMPUTATION REPORT', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`TaxSetu Offline Workstation | Generated: ${data.timestamp}`, 14, 24);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 27, 196, 27);

  // Profile Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Taxpayer Profile & Regime Parameters', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Taxpayer: ${data.taxpayer_name}`, 14, 40);
  doc.text(`PAN: ${data.pan_masked}`, 90, 40);
  doc.text(`Governing Act: ${data.act_name}`, 14, 46);
  doc.text(`Regime: ${data.regime} (FY ${data.financial_year} / AY ${data.assessment_year})`, 90, 46);

  // Table
  let y = 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Summary Computation Breakdown', 14, y);
  y += 6;

  const rows = [
    ['Gross Total Income (GTI)', `Rs. ${data.summary.gross_total_income.toLocaleString('en-IN')}`],
    ['Less: Deductions Claimed', `Rs. ${data.summary.total_deductions.toLocaleString('en-IN')}`],
    ['Net Taxable Total Income', `Rs. ${data.summary.taxable_total_income.toLocaleString('en-IN')}`],
    ['Normal Slab Tax', `Rs. ${data.summary.normal_slab_tax.toLocaleString('en-IN')}`],
    ['Special Rate Tax (STCG 111A / LTCG 112A)', `Rs. ${data.summary.special_rate_tax.toLocaleString('en-IN')}`],
    ['Tax Payable before Rebate', `Rs. ${data.summary.tax_before_rebate.toLocaleString('en-IN')}`],
    ['Less: Rebate u/s 87A', `Rs. ${data.summary.rebate_amount.toLocaleString('en-IN')}`],
    ['Tax after Rebate', `Rs. ${data.summary.tax_after_rebate.toLocaleString('en-IN')}`],
    ['Add: Surcharge', `Rs. ${data.summary.surcharge_amount.toLocaleString('en-IN')}`],
    ['Add: Health & Education Cess (4%)', `Rs. ${data.summary.cess_amount.toLocaleString('en-IN')}`],
    ['Total Tax Liability (Rounded u/s 288B)', `Rs. ${data.summary.total_tax_liability.toLocaleString('en-IN')}`],
    ['Less: Total Prepaid Taxes (TDS / Adv Tax)', `Rs. ${data.summary.total_prepaid_tax.toLocaleString('en-IN')}`],
    ['Net Balance Tax Payable / (Refund)', `Rs. ${data.summary.balance_tax_payable.toLocaleString('en-IN')}`],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  rows.forEach(([head, amt], index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 6, 'F');
    }
    if (head.includes('Total') || head.includes('Net Balance')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    }
    doc.text(head, 16, y);
    doc.text(amt, 194, y, { align: 'right' });
    y += 6;
  });

  // Advance Tax Instalments
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Advance Tax Instalment Progression Schedule', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  data.instalment_schedule.forEach(inst => {
    doc.text(
      `• Inst ${inst.instalment_number} (${inst.due_date}): Cumulative ${inst.cumulative_percent}% = Rs. ${inst.required_cumulative_amount.toLocaleString('en-IN')} (Status: ${inst.status.toUpperCase()})`,
      16,
      y
    );
    y += 5;
  });

  // Disclaimer
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text('Statutory Legal Disclaimer:', 14, y);
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  const splitDisclaimer = doc.splitTextToSize(data.disclaimer, 182);
  doc.text(splitDisclaimer, 14, y);

  doc.save(`Tax_Computation_${data.pan_masked}_${data.financial_year}.pdf`);
}

export function exportToWord(data: AdvanceTaxResult) {
  const content = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><title>Indian Income-Tax Computation</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #1e3a8a; font-size: 20pt; text-align: center; }
    h2 { color: #0f172a; font-size: 13pt; margin-top: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
    th { background: #f1f5f9; padding: 6px; text-align: left; border: 1px solid #cbd5e1; }
    td { padding: 6px; border: 1px solid #e2e8f0; }
    .bold-row { font-weight: bold; background: #f8fafc; }
    .disclaimer { color: #b91c1c; font-size: 8.5pt; font-style: italic; margin-top: 30px; }
  </style>
  </head>
  <body>
    <h1>INDIAN INCOME-TAX COMPUTATION REPORT</h1>
    <p style="text-align: center; color: #64748b; font-size: 10pt;">Comparative Tax Analysis & Estimation Workstation | Generated: ${data.timestamp}</p>
    
    <h2>1. Taxpayer Profile</h2>
    <table>
      <tr><td><b>Taxpayer Name</b></td><td>${data.taxpayer_name}</td></tr>
      <tr><td><b>Masked PAN</b></td><td>${data.pan_masked}</td></tr>
      <tr><td><b>Governing Act</b></td><td>${data.act_name}</td></tr>
      <tr><td><b>Tax Regime</b></td><td>${data.regime} (FY ${data.financial_year} / AY ${data.assessment_year})</td></tr>
    </table>

    <h2>2. Computation Breakdown</h2>
    <table>
      <tr><th>Computation Head</th><th>Amount (INR)</th></tr>
      <tr><td>Gross Total Income (GTI)</td><td>₹ ${data.summary.gross_total_income.toLocaleString('en-IN')}</td></tr>
      <tr><td>Less: Deductions Claimed</td><td>₹ ${data.summary.total_deductions.toLocaleString('en-IN')}</td></tr>
      <tr class="bold-row"><td>Net Taxable Total Income</td><td>₹ ${data.summary.taxable_total_income.toLocaleString('en-IN')}</td></tr>
      <tr><td>Normal Slab Tax</td><td>₹ ${data.summary.normal_slab_tax.toLocaleString('en-IN')}</td></tr>
      <tr><td>Special Rate Tax (STCG 111A / LTCG 112A)</td><td>₹ ${data.summary.special_rate_tax.toLocaleString('en-IN')}</td></tr>
      <tr><td>Tax Payable before Rebate</td><td>₹ ${data.summary.tax_before_rebate.toLocaleString('en-IN')}</td></tr>
      <tr><td>Less: Rebate u/s 87A</td><td>₹ ${data.summary.rebate_amount.toLocaleString('en-IN')}</td></tr>
      <tr><td>Tax after Rebate</td><td>₹ ${data.summary.tax_after_rebate.toLocaleString('en-IN')}</td></tr>
      <tr><td>Add: Surcharge</td><td>₹ ${data.summary.surcharge_amount.toLocaleString('en-IN')}</td></tr>
      <tr><td>Add: Health & Education Cess (4%)</td><td>₹ ${data.summary.cess_amount.toLocaleString('en-IN')}</td></tr>
      <tr class="bold-row"><td>Total Tax Liability (Rounded u/s 288B)</td><td>₹ ${data.summary.total_tax_liability.toLocaleString('en-IN')}</td></tr>
      <tr><td>Less: Total Prepaid Taxes (TDS / Advance Tax)</td><td>₹ ${data.summary.total_prepaid_tax.toLocaleString('en-IN')}</td></tr>
      <tr class="bold-row"><td>Net Balance Tax Payable / (Refund)</td><td>₹ ${data.summary.balance_tax_payable.toLocaleString('en-IN')}</td></tr>
    </table>

    <h2>3. Advance Tax Instalment Progression</h2>
    <table>
      <tr><th>Instalment</th><th>Due Date</th><th>Cumulative %</th><th>Required Cumulative (INR)</th><th>Status</th></tr>
      ${data.instalment_schedule
        .map(
          i =>
            `<tr><td>Instalment ${i.instalment_number}</td><td>${i.due_date}</td><td>${i.cumulative_percent}%</td><td>₹ ${i.required_cumulative_amount.toLocaleString('en-IN')}</td><td>${i.status.toUpperCase()}</td></tr>`
        )
        .join('')}
    </table>

    <div class="disclaimer">
      <b>Statutory Compliance Disclaimer:</b><br/>
      ${data.disclaimer}
    </div>
  </body>
  </html>
  `;

  const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tax_Computation_${data.pan_masked}_${data.financial_year}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTDSToExcel(data: TDSResult) {
  const wb = XLSX.utils.book_new();
  const summaryData = [
    ['INDIAN TAX DEDUCTION AT SOURCE (TDS) REPORT'],
    ['Generated On', data.timestamp],
    ['TDS Section', `${data.section} - ${data.section_title}`],
    ['Nature of Payment', data.nature_of_payment],
    ['Transaction Value (INR)', data.transaction_value],
    ['Annual Cumulative Value Prior (INR)', data.aggregate_annual_value],
    ['Threshold Limit (INR)', data.threshold_limit],
    ['Threshold Crossed?', data.is_threshold_crossed ? 'YES' : 'NO'],
    ['Amount Subject to TDS (INR)', data.amount_subject_to_tds],
    ['Applicable Rate %', `${data.effective_rate_percent}%`],
    ['Rate Classification', data.rate_note],
    ['Calculated TDS Amount (INR)', data.tds_amount],
    ['Due Date for Deposit', data.due_date_for_deposit],
    ['Statutory Reference', data.source_reference],
    [],
    ['STATUTORY COMPLIANCE DISCLAIMER'],
    [data.disclaimer]
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws, 'TDS Computation');
  XLSX.writeFile(wb, `TDS_${data.section}_Computation.xlsx`);
}
