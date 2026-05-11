import { useStore } from "@/lib/store";

interface LogAuditParams {
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
}

export function logAudit(params: LogAuditParams) {
  // We use the store directly via its getState method to avoid hook rules.
  // This utility should be called in handlers where the hook cannot be easily used.
  // Alternatively, just use logAudit from useStore() inside components.
  const { currentUser, logAudit: storeLogAudit } = useStore.getState();

  storeLogAudit({
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    actor: currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : "System",
    actorId: currentUser?.id || "SYS",
    role: currentUser?.roles?.[0] || "SYSTEM",
  });
}
