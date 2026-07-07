import { ShareholderAccount } from "@/types/account-maintenance";

export function fullName(account: ShareholderAccount) {
  return [account?.firstName, account?.otherNames, account?.lastName]
    .filter(Boolean)
    .join(" ");
}

export function getInitials(account: ShareholderAccount) {
  const first = account?.firstName?.[0] ?? "";
  const last = account?.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "--";
}
