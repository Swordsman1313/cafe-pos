import * as XLSX from "xlsx";

export interface ReportKPI {
  label: string;
  value: string;
  sublabel?: string;
}

export interface ReportColumn {
  header: string;
  key: string;
  align?: "left" | "center" | "right";
  format?: (val: any) => string;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  dateRangeLabel: string;
  kpis?: ReportKPI[];
  columns: ReportColumn[];
  data: any[];
  summaryRow?: Record<string, string | number>;
  branchName?: string;
  generatedBy?: string;
}

/**
 * Exports data to a formatted Microsoft Excel (.xlsx) file
 */
export function exportToExcel(
  filename: string,
  sheets: { sheetName: string; columns: ReportColumn[]; data: any[]; summary?: Record<string, any> }[]
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, columns, data, summary }) => {
    // Format rows
    const formattedRows = data.map((row) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col) => {
        const val = row[col.key];
        rowObj[col.header] = col.format ? col.format(val) : val ?? "—";
      });
      return rowObj;
    });

    if (summary) {
      const summaryObj: Record<string, any> = {};
      columns.forEach((col) => {
        summaryObj[col.header] = summary[col.key] ?? "";
      });
      formattedRows.push(summaryObj);
    }

    const ws = XLSX.utils.json_to_sheet(formattedRows);

    // Auto calculate column widths
    const colWidths = columns.map((col) => {
      const maxLen = Math.max(
        col.header.length,
        ...data.map((r) => String(r[col.key] ?? "").length),
        String(summary?.[col.key] ?? "").length
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  });

  const finalName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}

/**
 * Generates and prints an executive-grade PDF Report
 */
export function printExecutiveReport(config: ReportConfig) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to view and export the PDF report.");
    return;
  }

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${config.title} - Artisan Roast Report</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-icon {
          width: 36px;
          height: 36px;
          background: #f59e0b;
          color: #ffffff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 900;
        }
        .brand-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .brand-sub {
          font-size: 10px;
          color: #d97706;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .meta-info {
          text-align: right;
          font-size: 10px;
          color: #64748b;
        }
        .meta-info strong {
          color: #0f172a;
        }
        .report-title-box {
          margin-bottom: 16px;
        }
        .report-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .report-range {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          font-weight: 700;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #fde68a;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 10px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 10px;
          color: #334155;
        }
        tr:nth-child(even) td {
          background: #f8fafc;
        }
        tr.summary-row td {
          background: #fffbeb !important;
          font-weight: 800;
          color: #92400e;
          border-top: 2px solid #fde68a;
          border-bottom: 2px solid #fde68a;
        }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          page-break-inside: avoid;
        }
        .sig-box {
          border-top: 1px dashed #94a3b8;
          padding-top: 6px;
          text-align: center;
          font-size: 9px;
          color: #64748b;
          font-weight: 600;
        }
        .footer {
          margin-top: 24px;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
        }
        .print-btn-bar {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn {
          background: #f59e0b;
          color: #000;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 12px;
        }
        @media print {
          .print-btn-bar { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button class="btn" onclick="window.print()">🖨 Print or Save as PDF</button>
      </div>

      <div class="header">
        <div class="brand">
          <div class="brand-icon">☕</div>
          <div>
            <h1 class="brand-title">Artisan Roast Café</h1>
            <p class="brand-sub">Enterprise Management &amp; Financial Audit</p>
          </div>
        </div>
        <div class="meta-info">
          <p style="margin:0 0 2px 0;"><strong>Branch:</strong> ${config.branchName || "Main Branch (BKK1)"}</p>
          <p style="margin:0 0 2px 0;"><strong>Generated:</strong> ${generatedAt}</p>
          <p style="margin:0;"><strong>Auditor:</strong> ${config.generatedBy || "General Manager"}</p>
        </div>
      </div>

      <div class="report-title-box">
        <h2 class="report-title">${config.title}</h2>
        ${config.subtitle ? `<p style="margin:0 0 6px 0; color:#64748b; font-size:10px;">${config.subtitle}</p>` : ""}
        <span class="report-range">📅 Period: ${config.dateRangeLabel}</span>
      </div>

      ${
        config.kpis && config.kpis.length > 0
          ? `
        <div class="kpi-grid">
          ${config.kpis
            .map(
              (kpi) => `
            <div class="kpi-card">
              <div class="kpi-label">${kpi.label}</div>
              <div class="kpi-value">${kpi.value}</div>
              ${kpi.sublabel ? `<div class="kpi-sub">${kpi.sublabel}</div>` : ""}
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      <table>
        <thead>
          <tr>
            ${config.columns
              .map(
                (col) => `
              <th class="text-${col.align || "left"}">${col.header}</th>
            `
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${config.data
            .map(
              (row) => `
            <tr>
              ${config.columns
                .map((col) => {
                  const val = row[col.key];
                  const formatted = col.format ? col.format(val) : val ?? "—";
                  return `<td class="text-${col.align || "left"}">${formatted}</td>`;
                })
                .join("")}
            </tr>
          `
            )
            .join("")}
          ${
            config.summaryRow
              ? `
            <tr class="summary-row">
              ${config.columns
                .map((col) => {
                  const val = config.summaryRow?.[col.key] ?? "";
                  return `<td class="text-${col.align || "left"}">${val}</td>`;
                })
                .join("")}
            </tr>
          `
              : ""
          }
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-box">Prepared by (Cashier / Shift Lead)</div>
        <div class="sig-box">Verified by (Store Manager)</div>
        <div class="sig-box">Approved by (Head of Finance)</div>
      </div>

      <div class="footer">
        Artisan Roast Café Enterprise POS & Back-of-House System · Confidential Financial Audit Report
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
