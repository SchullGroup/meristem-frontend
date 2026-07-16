import type { Certificate, CertificateMovement } from "@/types/enquiry";

// Placeholder movement history built from the certificate's own real fields —
// stands in for ENQ-BE-06's movements[] until that endpoint exists. Never
// invents a date/agent the certificate doesn't already carry.
export function buildMockCertificateMovements(
  cert: Certificate,
): CertificateMovement[] {
  // Only certificates with real evidence of a movement (a transfer number)
  // get a history — an untouched certificate has no movements to show.
  // if (!cert.transferNo) return [];

  return [
    {
      id: `${cert.certificateNo}-issuance`,
      certificateNo: cert.certificateNo,
      movementType: "ISSUANCE",
      narration: "Certificate issued to holder",
      unitsMoved: cert.units,
      movementDate: cert.dateIssued || undefined,
      status: "COMPLETED",
    },
    {
      id: `${cert.certificateNo}-transfer`,
      certificateNo: cert.certificateNo,
      movementType: "TRANSFER",
      narration: "Certificate transferred via stockbroker lodgement",
      transferNo: cert.transferNo,
      unitsMoved: cert.unitsTransferred || undefined,
      agentCode: cert.stockbrokerCode || undefined,
      agentName: cert.stockbrokerCode || undefined,
      agentType: cert.stockbrokerCode ? "STOCKBROKER" : undefined,
      // No transfer date field exists on the certificate record yet —
      // left blank rather than reusing dateIssued, which would misrepresent it.
      status: cert.status === "TRANSFERRED" ? "COMPLETED" : cert.status,
    },
  ];
}
