import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  Principal,
  Register,
  Role,
  Agent,
  AgentType,
  Shareholder,
  Certificate,
  DividendDeclaration,
  DividendWarrant,
  CSCSBatch,
  DematRecord,
  KYCChange,
  AdmonRecord,
  AuditEntry,
  ApprovalItem,
  EmailJob,
} from "../types";

const SEED_AGENT_TYPES: AgentType[] = [
  { id: "AT-1", code: "BANK", label: "Bank", builtIn: true, active: true },
  {
    id: "AT-2",
    code: "STOCKBROKER",
    label: "Stockbroker",
    builtIn: true,
    active: true,
  },
  {
    id: "AT-3",
    code: "COLLECTING_AGENT",
    label: "Collecting Agent",
    builtIn: true,
    active: true,
  },
];
import { seedStore as seedStoreData } from "../mocks/seed";

export interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Master data
  principals: Principal[];
  registers: Register[];
  users: User[];
  roles: Role[];
  agents: Agent[];
  agentTypes: AgentType[];

  // Transactional data
  shareholders: Shareholder[];
  certificates: Certificate[];
  dividendDeclarations: DividendDeclaration[];
  dividendWarrants: DividendWarrant[];
  cscsBatches: CSCSBatch[];
  dematRecords: DematRecord[];
  kycChanges: KYCChange[];
  admonRecords: AdmonRecord[];
  auditLog: AuditEntry[];
  pendingApprovals: ApprovalItem[];
  emailJobs: EmailJob[];

  // CRUD actions
  addPrincipal: (p: Principal) => void;
  updatePrincipal: (id: string, updates: Partial<Principal>) => void;
  addRegister: (r: Register) => void;
  updateRegister: (id: string, updates: Partial<Register>) => void;
  addUser: (u: User) => void;
  setUsers: (users: User[]) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addAgent: (a: Agent) => void;
  addAgentType: (t: AgentType) => void;
  updateAgentType: (id: string, updates: Partial<AgentType>) => void;
  removeAgentType: (id: string) => void;
  addShareholder: (s: Shareholder) => void;
  updateShareholder: (id: string, updates: Partial<Shareholder>) => void;
  addCertificate: (c: Certificate) => void;
  updateCertificate: (id: string, updates: Partial<Certificate>) => void;
  addDividendDeclaration: (d: DividendDeclaration) => void;
  updateDividendDeclaration: (
    id: string,
    updates: Partial<DividendDeclaration>,
  ) => void;
  addApprovalItem: (item: ApprovalItem) => void;
  updateApprovalItem: (id: string, updates: Partial<ApprovalItem>) => void;
  addEmailJob: (job: EmailJob) => void;
  updateEmailJob: (id: string, updates: Partial<EmailJob>) => void;
  logAudit: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;

  // Utilities
  seedStore: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      principals: [],
      registers: [],
      users: [],
      roles: [],
      agents: [],
      agentTypes: SEED_AGENT_TYPES,
      shareholders: [],
      certificates: [],
      dividendDeclarations: [],
      dividendWarrants: [],
      cscsBatches: [],
      dematRecords: [],
      kycChanges: [],
      admonRecords: [],
      auditLog: [],
      pendingApprovals: [],
      emailJobs: [],

      addPrincipal: (p) =>
        set((state) => ({ principals: [...state.principals, p] })),
      updatePrincipal: (id, updates) =>
        set((state) => ({
          principals: state.principals.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      addRegister: (r) =>
        set((state) => ({ registers: [...state.registers, r] })),
      updateRegister: (id, updates) =>
        set((state) => ({
          registers: state.registers.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        })),
      addUser: (u) => set((state) => ({ users: [...state.users, u] })),
      setUsers: (users) => set({ users }),
      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...updates } : u,
          ),
        })),
      addAgent: (a) => set((state) => ({ agents: [...state.agents, a] })),
      addAgentType: (t) =>
        set((state) => ({ agentTypes: [...state.agentTypes, t] })),
      updateAgentType: (id, updates) =>
        set((state) => ({
          agentTypes: state.agentTypes.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),
      removeAgentType: (id) =>
        set((state) => ({
          agentTypes: state.agentTypes.filter((t) => t.id !== id),
        })),
      addShareholder: (s) =>
        set((state) => ({ shareholders: [...state.shareholders, s] })),
      updateShareholder: (id, updates) =>
        set((state) => ({
          shareholders: state.shareholders.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        })),
      addCertificate: (c) =>
        set((state) => ({ certificates: [...state.certificates, c] })),
      updateCertificate: (id, updates) =>
        set((state) => ({
          certificates: state.certificates.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),
      addDividendDeclaration: (d) =>
        set((state) => ({
          dividendDeclarations: [...state.dividendDeclarations, d],
        })),
      updateDividendDeclaration: (id, updates) =>
        set((state) => ({
          dividendDeclarations: state.dividendDeclarations.map((d) =>
            d.id === id ? { ...d, ...updates } : d,
          ),
        })),
      addApprovalItem: (item) =>
        set((state) => ({
          pendingApprovals: [...state.pendingApprovals, item],
        })),
      updateApprovalItem: (id, updates) =>
        set((state) => ({
          pendingApprovals: state.pendingApprovals.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        })),
      addEmailJob: (job) =>
        set((state) => ({ emailJobs: [...state.emailJobs, job] })),
      updateEmailJob: (id, updates) =>
        set((state) => ({
          emailJobs: state.emailJobs.map((j) =>
            j.id === id ? { ...j, ...updates } : j,
          ),
        })),
      logAudit: (entry) =>
        set((state) => ({
          auditLog: [
            ...state.auditLog,
            {
              ...entry,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      seedStore: () =>
        set((state) => {
          if (state.principals.length > 0) return {}; // Already seeded
          const data = seedStoreData();
          return { ...data };
        }),
    }),
    {
      name: "mrpsl-cpa-store",
    },
  ),
);
