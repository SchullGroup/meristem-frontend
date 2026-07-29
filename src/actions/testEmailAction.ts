// "use server";

export interface SendTestEmailPayload {
  /** Staff addresses that should receive the rendered template. */
  recipients: string[];
  subject: string;
  /** Human-readable description of what is being previewed, for the log. */
  templateLabel: string;
}

/**
 * STUB — the API has no test-email endpoint yet.
 *
 * Nothing is sent over the network; this resolves after a short delay so the
 * UI can exercise its pending/success states. The required backend contract is
 * specified in `backend_changes.md` → "Test Email Dispatch".
 *
 * To go live, replace the body below with the real `api.post` call. Every
 * caller goes through `useSendTestEmail`, so this is the only place to change.
 */
export const SEND_TEST_EMAIL = async ({
  recipients,
  subject,
  templateLabel,
}: SendTestEmailPayload) => {
  if (recipients.length === 0) {
    throw new Error("Add at least one test recipient.");
  }

  console.info("[SEND_TEST_EMAIL stub] no email dispatched", {
    recipients,
    subject,
    templateLabel,
  });

  await new Promise((resolve) => setTimeout(resolve, 700));

  return { isSuccessful: true, recipients };
};
