// Builds the bonus-allotment notification email HTML. The same HTML is used for the live preview
// and sent to the backend, which substitutes the [TOKEN] placeholders per shareholder.

export const DEFAULT_BONUS_EMAIL_INTRO =
  "This is to notify you of your bonus share allotment in the <strong>[SYMBOL]</strong> bonus issue. The details are set out below.";

export interface BonusEmailTemplateOptions {
  headerImageUrl?: string;
  intro?: string;
}

export function buildBonusEmailHtml(opts: BonusEmailTemplateOptions): string {
  const header = opts.headerImageUrl
    ? `<img src="${opts.headerImageUrl}" alt="" style="max-width:100%;display:block;margin:0 auto 20px;" />`
    : "";
  const intro = opts.intro && opts.intro.trim() ? opts.intro.trim() : DEFAULT_BONUS_EMAIL_INTRO;

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
      ${row("Units Held", "[UNITS HELD]")}
      ${row("Bonus Shares Due", "[BONUS DUE]")}
      ${row("Account Number", "[ACCOUNT NUMBER]")}
    </tbody>
  </table>
  <p>The bonus shares will be credited to your holding. Please contact the registrar for any clarification.</p>
  <p style="margin-top:24px;">Warm regards,<br/><strong>Meristem Registrars &amp; Probate Services Limited</strong></p>
</div>`.trim();
}
