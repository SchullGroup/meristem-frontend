// Builds the "certificates lodged" notification email HTML for IPO dispatch. The same HTML is
// used for the live preview and is sent to the backend, which substitutes the [TOKEN] placeholders
// per recipient. Images are embedded as a public URL (uploaded client-side via GetImageUrl).

export const IPO_EMAIL_TOKENS = [
  "[SHAREHOLDER NAME]",
  "[UNITS ALLOTTED]",
  "[UNITS APPLIED]",
  "[CERTIFICATE NUMBER]",
  "[SYMBOL]",
  "[CSCS ACCOUNT]",
  "[ACCOUNT NUMBER]",
] as const;

export const DEFAULT_IPO_EMAIL_INTRO =
  "We are pleased to inform you that the share certificate arising from your allotment in the <strong>[SYMBOL]</strong> public offer has been successfully lodged with the Central Securities Clearing System (CSCS).";

export interface IpoEmailTemplateOptions {
  headerImageUrl?: string;
  /** Editable opening paragraph (may contain tokens/HTML). Falls back to the default. */
  intro?: string;
}

export function buildIpoEmailHtml(opts: IpoEmailTemplateOptions): string {
  const header = opts.headerImageUrl
    ? `<img src="${opts.headerImageUrl}" alt="" style="max-width:100%;display:block;margin:0 auto 20px;" />`
    : "";
  const intro = opts.intro && opts.intro.trim() ? opts.intro.trim() : DEFAULT_IPO_EMAIL_INTRO;

  const row = (label: string, token: string) =>
    `<tr>
       <td style="padding:8px 0;color:#555555;border-bottom:1px solid #eeeeee;">${label}</td>
       <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px solid #eeeeee;">${token}</td>
     </tr>`;

  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;font-size:14px;line-height:1.6;padding:8px;">
  ${header}
  <p>Dear [SHAREHOLDER NAME],</p>
  <p>${intro}</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tbody>
      ${row("Certificate Number", "[CERTIFICATE NUMBER]")}
      ${row("Units Allotted", "[UNITS ALLOTTED]")}
      ${row("CSCS Account", "[CSCS ACCOUNT]")}
      ${row("Registrar Account", "[ACCOUNT NUMBER]")}
    </tbody>
  </table>
  <p>Your shares are now held electronically in your CSCS account and are available for trading through your stockbroker.</p>
  <p style="margin-top:24px;">Warm regards,<br/><strong>Meristem Registrars &amp; Probate Services Limited</strong></p>
</div>`.trim();
}
