# Meristem CPA — Share Registrar Management System

**MRPSL-CPA** is the front-end web application for Meristem's **Central Processing Application (CPA)** — a comprehensive share registrar management platform. It is used by registrar staff and administrators to manage the full lifecycle of company shares, shareholders, dividends, and corporate actions on behalf of listed companies in Nigeria.

---

## What Does This Application Do?

In the Nigerian capital market, a **share registrar** is a company (like Meristem Registrars) that keeps official records of who owns shares in a public company. When you buy shares of a company listed on the Nigerian Exchange (NGX), your name and share balance are recorded in a **register** maintained by the registrar.

This application is the internal tool that registrar staff use every day to manage those records. Think of it as the "back office" system behind every share certificate, dividend payment, and shareholder update.

---

## Core Concepts (Plain Language)

| Term | What It Means |
|---|---|
| **Principal** | A listed company (e.g., a bank or telecoms firm) whose shareholders the registrar manages |
| **Register** | The official book of shareholders for a specific class of shares of a Principal (e.g., Ordinary shares, Preference shares) |
| **Shareholder / Holder** | An individual or institution that owns shares in a company |
| **CHN** | Central Holder Number — a unique national ID for every investor in Nigeria |
| **CSCS** | Central Securities Clearing System — the Nigerian exchange's central depository that tracks electronic share holdings |
| **Dividend** | A portion of a company's profits paid out to shareholders |
| **IPO** | Initial Public Offering — when a company sells new shares to the public for the first time |
| **Rights Issue** | An offer that lets existing shareholders buy additional shares, usually at a discount |
| **Approval Workflow** | Multi-level review process where transactions must be approved by multiple staff (Tier 1 → Tier 4) before being finalised |

---

## Key Features & Modules

### 📊 Dashboard
The home screen gives staff an at-a-glance summary of the system, including:
- Total number of principals under management
- Number of active registers
- Pending approvals requiring attention
- Recent dividend declarations
- Quick links to the most recent transactions awaiting review

---

### 🏢 Setup & Administration
Tools for configuring the system and managing users:
- **Principals** — Add and manage listed companies and their details (address, TIN, RC number, company secretary, NGX listing date, etc.)
- **Registers** — Create and manage the share registers for each principal (register type, stock symbol, number of shares in issue)
- **Users & Roles** — Manage staff accounts and assign roles that control what each person can see and do
- **Agents** — Manage agents who work with the registrar
- **Parameters** — Configure system-wide settings

---

### 🔍 Enquiry
A read-only lookup section for staff to search and review information:
- **Shareholders** — Search for any shareholder by name, account number, or CHN; view their full profile including personal details, contact information, bank details, and current holdings
- **Certificates** — Look up physical share certificates and their status
- **Agents** — View agent information
- **Bonus & Rights** — Review entitlements from bonus issues and rights offers
- **Warrants** — Look up warrant (an instrument that gives holders the right to buy shares at a set price) details

---

### 📜 Certificates
Manage physical and electronic share certificates:
- **Transfer** — Process the transfer of shares from one holder to another (e.g., when shares are sold off-market or gifted)
- **Consolidation** — Merge multiple share certificates belonging to the same person into one
- **Dematerialisation** — Convert old paper certificates into electronic form
- **Reconciliation** — Verify and reconcile certificate records between the registrar's system and the CSCS
- **Split** — Split one certificate into multiple smaller ones
- **CSCS Updates** — Process updates from the Central Securities Clearing System (electronic market trades)

---

### 💰 Dividends
End-to-end processing of dividend payments:
- **Declaration** — Create and record a new dividend declaration for a company (including dividend rate, payment date, and qualifying date)
- **New Mandate** — Register a shareholder's payment instruction (e.g., direct bank transfer)
- **Payment** — Process and authorise dividend payments to shareholders
- **Warrant Markoff** — Record that a dividend warrant (a physical payment instrument) has been presented and paid
- **Return Money** — Process unclaimed dividends or returned funds
- **Reports** — Generate detailed dividend reports by shareholder, register, or period
- **Split** — Handle cases where a dividend needs to be split across multiple accounts

---

### 📣 Offers
Manage corporate actions where new shares are offered to investors:
- **IPO (Initial Public Offering)** — Process applications from the public when a company first lists on the stock exchange. Includes batch upload of subscriber data, approval/disapproval of applications, and management of refunds for unsuccessful applicants
- **Rights Issue** — Manage the process where existing shareholders are offered the right to buy new shares at a preferential price. Includes computing entitlements and processing subscriptions
- **Bonus Issue** — Process free shares given to existing shareholders as a reward (similar to a stock dividend)
- **Return Money** — Handle refunds from oversubscribed or unsuccessful offer applications

---

### 🛠️ Account Maintenance
Tools for updating shareholder records:
- **KYC Update** — Update a shareholder's Know Your Customer information (identity documents, bank details, contact info)
- **Consolidation** — Merge duplicate shareholder accounts
- **ADMOR** — Administrative adjustments to shareholder accounts

---

### ✅ Approvals
A centralised approval queue for reviewing and authorising transactions:
- **My Desk** — Shows transactions assigned to the currently logged-in staff member for review
- **Global Queue** — A supervisory view showing all pending transactions across the system
- Transactions go through up to **4 tiers of approval** (Tier 1 → Tier 4) before being finalised, ensuring a strong audit trail and preventing errors or fraud

---

### 📈 Reports
Generate and export management reports on various aspects of the system — dividend summaries, shareholder listings, transaction histories, and more. Reports can be exported to Excel or printed as PDFs.

---

### 🔔 Notifications
System-generated alerts and notifications for important events (e.g., a transaction needing your approval, a payment processed, etc.).

---

## Security & Access Control

- **Login Required** — All pages are protected. Staff must sign in with their username and password to access the system
- **Session Expiry** — Sessions automatically expire after a period of inactivity, protecting sensitive data
- **Role-Based Access** — Different staff roles see different parts of the system. A data entry clerk will have different access permissions than a branch manager or director
- **Audit Trail** — All significant actions are logged, recording who did what and when

---

## Technology Stack (For Developers)

This is a modern web application built with the following technologies:

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | Core web framework (React-based) |
| [React 19](https://react.dev/) | UI component library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript for fewer bugs |
| [TailwindCSS v4](https://tailwindcss.com/) | Utility-first CSS styling |
| [shadcn/ui](https://ui.shadcn.com/) | Pre-built accessible UI components |
| [TanStack Query](https://tanstack.com/query) | Data fetching and server state management |
| [Zustand](https://zustand-demo.pmnd.rs/) | Global client-side state management |
| [React Hook Form + Zod](https://react-hook-form.com/) | Form handling and validation |
| [Framer Motion](https://www.framer.com/motion/) | Animations and transitions |
| [Axios](https://axios-http.com/) | HTTP client for API communication |
| [xlsx](https://sheetjs.com/) | Excel file export |
| [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) | PDF generation |

---

## Getting Started (Development Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) version 18 or higher
- npm (comes with Node.js)
- Access to the backend API (ask your team lead for the API base URL)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd meristem-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add the required environment variables:
   ```env
   NEXT_PUBLIC_API_BASE_URL=<your-api-base-url>
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint to check code quality |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # All authenticated pages (dashboard layout)
│   │   ├── page.tsx        # Dashboard home
│   │   ├── setup/          # User, roles, principal, register management
│   │   ├── enquiry/        # Shareholder & certificate lookups
│   │   ├── certificates/   # Certificate operations
│   │   ├── dividends/      # Dividend processing
│   │   ├── offers/         # IPO, rights issue, bonus issue
│   │   ├── account-maintenance/ # KYC and account updates
│   │   ├── approvals/      # Multi-tier approval workflows
│   │   ├── reports/        # Report generation
│   │   └── notifications/  # System notifications
│   ├── login/              # Login page (public)
│   └── reset-password/     # Password reset (public)
├── components/
│   ├── ui/                 # Base UI components (shadcn)
│   ├── custom/             # Feature-specific components
│   └── shell/              # Layout components (Sidebar, Header)
├── hooks/                  # Custom React hooks for data fetching
├── actions/                # Server/API action functions
├── lib/                    # Utilities, store, schemas, type helpers
├── services/               # API service layer (axios calls)
├── types/                  # TypeScript type definitions
└── utils/                  # Helper utilities
```

---

## Regulatory Context

This application operates within the Nigerian capital markets regulatory framework, which is overseen by the **Securities and Exchange Commission (SEC) Nigeria** and the **Nigerian Exchange Group (NGX)**. The system supports compliance with:
- SEC Nigeria rules on share registrar operations
- NGX listing requirements and reporting obligations
- Anti-money laundering (AML) / KYC requirements for shareholder identification
- CSCS connectivity requirements for electronic share trading reconciliation

---

*For technical questions or issues, please contact the development team.*
