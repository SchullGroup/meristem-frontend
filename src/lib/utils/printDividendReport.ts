import {
  DividendReport,
  LiabilityRow,
  WhtRow,
  PaymentStatusRow,
  UnclaimedRow,
  MandatePaymentRow,
  RegisterSummaryRow,
} from "@/actions/dividendReportActions";
import { formatCurrency, formatNaira } from "./format";

export type DividendReportType =
  | "liability-register"
  | "wht-deduction"
  | "payment-status"
  | "unclaimed-dividends"
  | "mandate-payments"
  | "declaration-summary";

export interface PrintConfig {
  title: string;
  summaryCards: Array<{ label: string; value: string }>;
  tableHeaders: string[];
  tableRows: string[];
}

const printStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      margin: 30px;
      line-height: 1.6;
    }
    h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    h2 { font-size: 16px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; color: #1f2937; }
    
    /* Card Grid Styling */
    .card-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    @media print { .card-container { grid-template-columns: repeat(2, 1fr); } }
    .card { border: 1px solid #e0e0e0; background: #fafafa; padding: 15px; border-radius: 6px; }
    .card small { text-transform: uppercase; color: #777; font-size: 11px; letter-spacing: 0.5px; font-weight: bold; }
    .card h3 { margin: 8px 0 0 0; font-size: 18px; color: #222; word-break: break-word; }
    .card.highlight { background: #eff6ff; border-color: #bfdbfe; }
    .card.highlight h3 { color: #1e40af; }
    
    /* Table Styling */
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: 600; color: #374151; border-bottom: 2px solid #d1d5db; }
    tr:nth-child(even) { background-color: #fafafa; }
    tr:hover { background-color: #f9fafb; }
    td.number { text-align: right; font-family: 'Courier New', monospace; }
    
    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
    
    @media print {
      body { margin: 20px; }
      .card-container { margin-bottom: 20px; }
      table { page-break-inside: avoid; }
    }
  </style>
`;

function generatePrintHTML(
  reportTitle: string,
  summaryCards: Array<{ label: string; value: string }>,
  tableHeaders: string[],
  tableRows: string[],
): string {
  const cardsHTML = summaryCards
    .map(
      (card, i) => `
    <div class="card ${i === summaryCards.length - 1 ? "highlight" : ""}">
      <small>${card.label}</small>
      <h3>${card.value}</h3>
    </div>
  `,
    )
    .join("");

  const headerRow = tableHeaders.map((header) => `<th>${header}</th>`).join("");

  const bodyRows = tableRows.join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${reportTitle}</title>
        ${printStyles}
      </head>
      <body>
        <h1>${reportTitle}</h1>
        <h2>Summary</h2>
        <div class="card-container">${cardsHTML}</div>
        <h2>Details</h2>
        <table>
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
}

export function printLiabilityRegisterReport(report: DividendReport): void {
  const summaryCards = [
    { label: "Register", value: report.registerSymbol || "—" },
    { label: "Rate/Share", value: formatCurrency(report.rate ?? 0) },
    {
      label: "Total Shareholders",
      value: (report.totalShareholders ?? 0).toLocaleString(),
    },
    {
      label: "Total Net Payout",
      value: formatNaira(report.totalNetPayout ?? 0),
    },
  ];

  const tableRows = (report.liabilityRows ?? [])
    .map(
      (row: LiabilityRow) => `
    <tr>
      <td>${row.serial}</td>
      <td>${row.accountNumber}</td>
      <td>${row.holderName}</td>
      <td>${row.chn || "—"}</td>
      <td class="number">${formatNumber(row.units)}</td>
      <td class="number">${formatNaira(row.grossDividend)}</td>
      <td class="number">${formatNaira(row.whtAmount)}</td>
      <td class="number">${formatNaira(row.netDividend)}</td>
    </tr>
  `,
    )
    .join("");

  const html = generatePrintHTML(
    "Dividend Liability Register",
    summaryCards,
    [
      "#",
      "Account No",
      "Holder Name",
      "CHN",
      "Units",
      "Gross Div (₦)",
      "WHT (₦)",
      "Net Div (₦)",
    ],
    tableRows ? [tableRows] : [],
  );

  openPrintWindow(html);
}

export function printWhtDeductionReport(report: DividendReport): void {
  const summaryCards = [
    { label: "Register", value: report.registerSymbol || "—" },
    {
      label: "Shareholders Assessed",
      value: (report.shareholdersAssessed ?? 0).toLocaleString(),
    },
    {
      label: "Total Gross",
      value: formatNaira(report.totalGrossLiability ?? 0),
    },
    { label: "Total WHT @ 10%", value: formatNaira(report.totalWht ?? 0) },
  ];

  const tableRows = (report.whtRows ?? [])
    .map(
      (row: WhtRow) => `
    <tr>
      <td>${row.serial}</td>
      <td>${row.accountNumber}</td>
      <td>${row.holderName}</td>
      <td>${row.holderType || "N/A"}</td>
      <td class="number">${formatNumber(row.units)}</td>
      <td class="number">${formatNaira(row.grossDividend)}</td>
      <td>${row.whtRate || "N/A"}</td>
      <td class="number">${formatNaira(row.whtAmount)}</td>
      <td class="number">${formatNaira(row.netDividend)}</td>
    </tr>
  `,
    )
    .join("");

  const html = generatePrintHTML(
    "WHT Deduction Report",
    summaryCards,
    [
      "#",
      "Account No",
      "Holder Name",
      "Holder Type",
      "Units",
      "Gross Div (₦)",
      "WHT Rate",
      "WHT Amount (₦)",
      "Net Div (₦)",
    ],
    tableRows ? [tableRows] : [],
  );

  openPrintWindow(html);
}

export function printPaymentStatusReport(report: DividendReport): void {
  const summaryCards = [
    {
      label: "Total Declarations",
      value: (report.totalDeclarations ?? 0).toLocaleString(),
    },
    {
      label: "Authorized/Paid",
      value: (report.authorizedOrPaid ?? 0).toLocaleString(),
    },
    {
      label: "Pending Approval",
      value: (report.pendingApproval ?? 0).toLocaleString(),
    },
    {
      label: "Total Liability",
      value: formatNaira(report.totalGrossLiability ?? 0),
    },
  ];

  const tableRows = (report.paymentStatusRows ?? [])
    .map(
      (row: PaymentStatusRow) => `
    <tr>
      <td>${row.serial}</td>
      <td>${row.paymentNumber || "N/A"}</td>
      <td>${row.registerSymbol || "N/A"}</td>
      <td>${row.dividendType || "N/A"}</td>
      <td>${row.qualificationDate || "N/A"}</td>
      <td class="number">${formatNaira(row.ratePerShare) || "N/A"}</td>
      <td class="number">${formatNaira(row.grossLiability) || "N/A"}</td>
      <td class="number">${formatNaira(row.whtAmount)}</td>
      <td class="number">${formatNaira(row.netPayout)}</td>
      <td>${row.status || "N/A"}</td>
    </tr>
  `,
    )
    .join("");

  const html = generatePrintHTML(
    "Payment Status Report",
    summaryCards,
    [
      "#",
      "Payment No",
      "Register",
      "Div Type",
      "Qual Date",
      "Rate (₦/SH)",
      "Gross Liability",
      "WHT",
      "Net Payout",
      "Status",
    ],
    tableRows ? [tableRows] : [],
  );

  openPrintWindow(html);
}

export function printUnclaimedDividendsReport(report: DividendReport): void {
  const summaryCards = [
    {
      label: "Unclaimed Warrants",
      value: (report.unclaimedWarrants ?? 0).toLocaleString(),
    },
    {
      label: "Total Unclaimed Amount",
      value: formatNaira(report.totalUnclaimedAmount ?? 0),
    },
    {
      label: "Avg Days Outstanding",
      value: Math.round(report.averageDaysOutstanding ?? 0).toString(),
    },
    { label: "Register", value: report.registerSymbol || "—" },
  ];

  const tableRows = (report.unclaimedRows ?? [])
    .map(
      (row: UnclaimedRow) => `
    <tr>
      <td>${row.serial}</td>
      <td>${row.warrantNumber || "N/A"}</td>
      <td>${row.accountNumber}</td>
      <td>${row.holderName}</td>
      <td>${row.dividendNumber || "N/A"}</td>
      <td class="number">${formatNaira(row.amount) || "N/A"}</td>
      <td>${row.dateIssued || "N/A"}</td>
      <td class="number">${row.daysOutstanding || "N/A"}</td>
      <td>${row.status}</td>
    </tr>
  `,
    )
    .join("");

  const html = generatePrintHTML(
    "Unclaimed Dividends Report",
    summaryCards,
    [
      "#",
      "Warrant No",
      "Account No",
      "Holder Name",
      "Dividend No",
      "Amount (₦)",
      "Date Issued",
      "Days Outstanding",
      "Status",
    ],
    tableRows ? [tableRows] : [],
  );

  openPrintWindow(html);
}

export function printMandatePaymentReport(report: DividendReport): void {
  const summaryCards = [
    { label: "Register", value: report.registerSymbol || "—" },
    { label: "Dividend No", value: report.dividendNumber || "—" },
  ];

  const tableRows = (report.mandatePaymentRows ?? [])
    .map(
      (row: MandatePaymentRow) => `
    <tr>
      <td>${row.serial}</td>
      <td>${row.accountNumber || "N/A"}</td>
      <td>${row.holderName}</td>
      <td>${row.newBank || "N/A"}</td>
      <td>${row.bankAccountNumber || "N/A"}</td>
      <td>${row.sortCode || "N/A"}</td>
      <td class="number">${formatNaira(row.amount) || "N/A"}</td>
      <td>${row.dividendNumber || "N/A"}</td>
      <td>${row.status}</td>
    </tr>
  `,
    )
    .join("");

  const html = generatePrintHTML(
    "Mandate Payment Report",
    summaryCards,
    [
      "#",
      "Account No",
      "Holder Name",
      "New Bank",
      "Bank Account No",
      "Sort Code",
      "Amount (₦)",
      "Dividend No",
      "Status",
    ],
    tableRows ? [tableRows] : [],
  );

  openPrintWindow(html);
}

export function printDeclarationSummaryReport(report: DividendReport): void {
  const summaryCards = [
    {
      label: "Total Declarations",
      value: (report.totalDeclarations ?? 0).toLocaleString(),
    },
    {
      label: "Total Gross Liability",
      value: formatNaira(report.totalGrossLiability ?? 0),
    },
    { label: "Total WHT", value: formatNaira(report.totalWht ?? 0) },
    {
      label: "Total Net Payout",
      value: formatNaira(report.totalNetPayout ?? 0),
    },
  ];

  const tableRows = (report.byRegister ?? [])
    .map(
      (row: RegisterSummaryRow) => `
    <tr>
      <td>${row.registerSymbol}</td>
      <td>${row.registerType}</td>
      <td class="number">${row.declarationCount}</td>
      <td class="number">${formatNaira(row.totalGrossLiability)}</td>
      <td class="number">${formatNaira(row.totalWht)}</td>
      <td class="number">${formatNaira(row.totalNetPayout)}</td>
      <td>${row.latestDividendType ?? "—"}</td>
      <td class="number">${row.latestRate?.toFixed(4) ?? "—"}</td>
    </tr>
  `,
    )
    .join("");

  const html = generatePrintHTML(
    "Declaration Summary Report",
    summaryCards,
    [
      "Register",
      "Register Type",
      "Declarations",
      "Total Gross Liability",
      "Total WHT",
      "Total Net Payout",
      "Latest Div Type",
      "Latest Rate (₦)",
    ],
    tableRows ? [tableRows] : [],
  );

  openPrintWindow(html);
}

function openPrintWindow(html: string): void {
  const printWindow = window.open("", "", "height=800,width=1000");

  if (!printWindow) {
    console.error("Failed to open print window");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Delay print to ensure content is rendered
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export async function exportToPDF(html: string): Promise<void> {
  // This requires an external library like html2pdf or jsPDF
  // For now, we'll use the print dialog which allows "Save as PDF"
  const printWindow = window.open("", "", "height=800,width=1000");
  if (!printWindow) {
    console.error("Failed to open print window");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
