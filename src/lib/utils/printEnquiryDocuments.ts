import type { DividendStatement, HolderStatement } from "@/types/enquiry";

export const REGISTRAR_NAME = "Meristem Registrars & Probate Services Ltd";
export const REGISTRAR_ADDRESS = "213 Herbert Macaulay Way, Yaba, Lagos";
export const BRAND_COLOR = "#004023";

interface HolderIdentity {
  name: string;
  accountNumber?: string | null;
  chn?: string | null;
  registerSymbol?: string | null;
  address?: string | null;
}

interface BrandedDocumentOptions {
  documentTitle: string;
  holder: HolderIdentity;
  summaryCards: Array<{ label: string; value: string }>;
  tableHeaders: string[];
  tableRowsHtml: string;
}

function logoUrl(): string {
  return `${window.location.origin}/logo.svg`;
}

const brandedStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; }
    .letterhead { display: flex; align-items: center; justify-content: space-between; padding: 24px 32px; border-bottom: 3px solid ${BRAND_COLOR}; }
    .letterhead img { height: 44px; display: block; }
    .letterhead .registrar { text-align: right; }
    .letterhead .registrar .name { font-weight: 700; font-size: 13px; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.04em; }
    .letterhead .registrar .addr { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .body { padding: 24px 32px; }
    h1 { font-size: 20px; margin-bottom: 4px; color: #111827; }
    .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
    .identity { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; font-size: 12.5px; }
    .identity span.label { color: #6b7280; display: inline-block; min-width: 90px; }
    .identity span.value { font-weight: 600; color: #111827; }
    .card-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 24px; }
    .card { border: 1px solid #e0e0e0; background: #fafafa; padding: 14px; border-radius: 6px; }
    .card small { text-transform: uppercase; color: #777; font-size: 10.5px; letter-spacing: 0.5px; font-weight: bold; }
    .card h3 { margin: 6px 0 0 0; font-size: 18px; color: #222; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    thead { display: table-header-group; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: 600; color: #374151; border-bottom: 2px solid #d1d5db; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.03em; }
    tr:nth-child(even) { background-color: #fafafa; }
    tr { page-break-inside: avoid; }
    td.number { text-align: right; font-family: 'Courier New', monospace; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      .letterhead { padding: 16px 24px; }
      .body { padding: 16px 24px; }
    }
  </style>
`;

function identityRow(label: string, value?: string | null): string {
  return `<span class="label">${label}:</span> <span class="value">${value ?? "—"}</span>`;
}

function brandedDocumentHTML({
  documentTitle,
  holder,
  summaryCards,
  tableHeaders,
  tableRowsHtml,
}: BrandedDocumentOptions): string {
  const cardsHTML = summaryCards
    .map((c) => `<div class="card"><small>${c.label}</small><h3>${c.value}</h3></div>`)
    .join("");
  const headerRow = tableHeaders.map((h) => `<th>${h}</th>`).join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle} — ${holder.name}</title>
        ${brandedStyles}
      </head>
      <body>
        <div class="letterhead">
          <img src="${logoUrl()}" alt="Meristem" />
          <div class="registrar">
            <div class="name">${REGISTRAR_NAME}</div>
            <div class="addr">${REGISTRAR_ADDRESS}</div>
          </div>
        </div>
        <div class="body">
          <h1>${documentTitle}</h1>
          <div class="subtitle">Issued to ${holder.name}</div>
          <div class="identity">
            <div>${identityRow("Account No", holder.accountNumber)}</div>
            <div>${identityRow("Register", holder.registerSymbol)}</div>
            ${holder.chn ? `<div>${identityRow("CHN", holder.chn)}</div>` : ""}
            <div>${identityRow("Address", holder.address)}</div>
          </div>
          <div class="card-container">${cardsHTML}</div>
          <table>
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} · This is a system-generated document issued by ${REGISTRAR_NAME}
          </div>
        </div>
      </body>
    </html>
  `;
}

function openPrintWindow(html: string): void {
  const printWindow = window.open("", "", "height=900,width=1100");

  if (!printWindow) {
    console.error("Failed to open print window — check pop-up blocker settings");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 300);
}

export function printStatementOfAccount(
  statement: HolderStatement,
  holderAddress?: string | null,
): void {
  const rows =
    statement.transactions.length > 0
      ? statement.transactions
          .map(
            (t) => `
        <tr>
          <td>${t.date ?? "—"}</td>
          <td>${t.description ?? "—"}</td>
          <td>${t.reference ?? "—"}</td>
          <td class="number">${t.debit > 0 ? t.debit.toLocaleString() : "—"}</td>
          <td class="number">${t.credit > 0 ? t.credit.toLocaleString() : "—"}</td>
          <td class="number">${t.balance.toLocaleString()}</td>
        </tr>
      `,
          )
          .join("")
      : `<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:24px;">No transactions found for this period</td></tr>`;

  const html = brandedDocumentHTML({
    documentTitle: "Statement of Account",
    holder: {
      name: statement.holderName,
      accountNumber: statement.accountNumber,
      registerSymbol: statement.registerSymbol,
      address: holderAddress,
    },
    summaryCards: [
      { label: "Current Holdings", value: statement.currentHoldings.toLocaleString() },
      { label: "Opening Balance", value: statement.openingBalance.toLocaleString() },
      {
        label: "Net Movement",
        value: `${statement.netMovement >= 0 ? "+" : ""}${statement.netMovement.toLocaleString()}`,
      },
    ],
    tableHeaders: ["Date", "Transaction", "Reference", "Debit", "Credit", "Balance"],
    tableRowsHtml: rows,
  });

  openPrintWindow(html);
}

export function printDividendStatement(
  statement: DividendStatement,
  holderAddress?: string | null,
): void {
  const rows =
    statement.dividends.length > 0
      ? statement.dividends
          .map(
            (d) => `
        <tr>
          <td>${d.dividendNo ?? "—"}</td>
          <td>${d.declDate ?? "—"}</td>
          <td>${d.paymentDate ?? "—"}</td>
          <td class="number">${d.rate.toFixed(2)}</td>
          <td class="number">${d.gross.toLocaleString()}</td>
          <td class="number">${d.wht.toLocaleString()}</td>
          <td class="number">${d.net.toLocaleString()}</td>
          <td>${d.status ?? "—"}</td>
          <td>${d.method ?? "—"}</td>
        </tr>
      `,
          )
          .join("")
      : `<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px;">No dividends found for this period</td></tr>`;

  const html = brandedDocumentHTML({
    documentTitle: "Dividend Statement",
    holder: {
      name: statement.holderName,
      accountNumber: statement.accountNumber,
      registerSymbol: statement.registerSymbol,
      address: holderAddress,
    },
    summaryCards: [
      { label: "Total Gross (₦)", value: statement.totalGross.toLocaleString() },
      { label: "Total Net (₦)", value: statement.totalNet.toLocaleString() },
      { label: "Unpaid Amount (₦)", value: statement.unpaidAmount.toLocaleString() },
    ],
    tableHeaders: [
      "Dividend No",
      "Decl. Date",
      "Payment Date",
      "Rate (₦)",
      "Gross (₦)",
      "Tax (₦)",
      "Net (₦)",
      "Status",
      "Method",
    ],
    tableRowsHtml: rows,
  });

  openPrintWindow(html);
}

interface SignatureOnFile {
  signatureUrl?: string | null;
  capturedAt?: string | null;
  lastUpdatedAt?: string | null;
}

export function printSignatureOnFile(
  holder: HolderIdentity,
  signature: SignatureOnFile,
): void {
  const imageBlock = signature.signatureUrl
    ? `<img src="${signature.signatureUrl}" alt="Holder signature" style="max-height:140px;max-width:100%;object-fit:contain;" />`
    : `<div style="color:#9ca3af;">No signature on file</div>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Signature on File — ${holder.name}</title>
        ${brandedStyles}
      </head>
      <body>
        <div class="letterhead">
          <img src="${logoUrl()}" alt="Meristem" />
          <div class="registrar">
            <div class="name">${REGISTRAR_NAME}</div>
            <div class="addr">${REGISTRAR_ADDRESS}</div>
          </div>
        </div>
        <div class="body">
          <h1>Signature on File</h1>
          <div class="subtitle">${holder.name}</div>
          <div class="identity">
            <div>${identityRow("Account No", holder.accountNumber)}</div>
            <div>${identityRow("Register", holder.registerSymbol)}</div>
            ${holder.chn ? `<div>${identityRow("CHN", holder.chn)}</div>` : ""}
            ${holder.address ? `<div>${identityRow("Address", holder.address)}</div>` : ""}
            <div>${identityRow("Captured", signature.capturedAt)}</div>
            <div>${identityRow("Last Updated", signature.lastUpdatedAt)}</div>
          </div>
          <div style="border:1px solid #e5e7eb;border-radius:8px;padding:32px;display:flex;align-items:center;justify-content:center;min-height:160px;background:#fafafa;">
            ${imageBlock}
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} · This is a system-generated document issued by ${REGISTRAR_NAME}
          </div>
        </div>
      </body>
    </html>
  `;

  openPrintWindow(html);
}
