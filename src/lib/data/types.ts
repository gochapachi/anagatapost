import type {
  AddressBookEntry,
  AuditLog,
  Letter,
  LetterTemplate,
  Role,
  TaxInvoice,
} from "../types";

/** The shape every user row is handed to the rest of the app in. */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  /** Nullable: an OAuth-only account never has a password hash. */
  password?: string | null;
  role: Role;
  phone?: string | null;
  company?: string | null;
  gstin?: string | null;
  balancePaise: number;
  image?: string | null;
  createdAt: string;
}

export type BalanceReason = "insufficient" | "unknown_user";

export interface ChargeResult {
  ok: boolean;
  /** Balance after the charge when ok, balance before it when not. */
  balancePaise: number;
  reason?: BalanceReason;
}

export interface DraftSendResult {
  ok: boolean;
  reason?: "insufficient" | "not_found" | "not_draft";
  balancePaise: number;
  letter?: Letter;
}

export interface SettlePaymentInput {
  orderId: string;
  userId: string;
  amountPaise: number;
  eventType: string;
  payload: string;
  /** When set, the order paid for one letter: it is queued instead of the wallet. */
  letterId?: string | null;
  gstin?: string | null;
}

export interface SettlePaymentResult {
  /** True when this order id had already been settled — nothing moved. */
  duplicate: boolean;
  balancePaise: number;
  invoiceNumber: string | null;
  letterQueued: boolean;
}

export interface AnalyticsData {
  kpis: {
    totalDispatches: number;
    totalDelivered: number;
    totalInTransit: number;
    totalQueued: number;
    totalPrinted: number;
    slaPercent: string;
    totalRevenueInr: string;
    coveredPostalZones: number;
    totalRegisteredUsers: number;
  };
  stateDistribution: { state: string; count: number; percentage: number }[];
  monthlyTrends: { month: string; dispatches: number; revenueInr: number }[];
}

/**
 * Everything the routes are allowed to touch. Implemented twice: once over
 * Postgres (production) and once over the legacy in-memory maps (a laptop with
 * no database). Money methods are transactions in the Postgres implementation.
 */
export interface Store {
  // Users
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createUser(user: Omit<UserRecord, "id" | "createdAt">): Promise<UserRecord>;
  getAllUsers(): Promise<UserRecord[]>;
  updateUserRole(userId: string, role: Role): Promise<UserRecord | null>;
  adjustUserBalance(userId: string, amountPaiseDelta: number): Promise<number | null>;
  getBalancePaise(userId: string): Promise<number>;
  deductBalance(amountPaise: number, userId: string): Promise<boolean>;
  topupBalance(amountPaise: number, userId: string): Promise<number>;

  /** Charge a fresh letter and insert it in the same transaction. */
  createLetterCharged(
    letter: Letter,
    description: string
  ): Promise<ChargeResult & { letter?: Letter }>;
  /** Charge a draft and flip it to QUEUED in the same transaction. */
  sendDraftCharged(
    letterId: string,
    userId: string,
    description: string
  ): Promise<DraftSendResult>;

  // Letters
  getLetters(userId?: string): Promise<Letter[]>;
  getLetterById(id: string): Promise<Letter | null>;
  saveLetter(letter: Letter): Promise<Letter>;
  updateLetter(id: string, updates: Partial<Letter>): Promise<Letter | null>;

  // Address book
  getAddressBook(userId: string): Promise<AddressBookEntry[]>;
  saveAddressBookEntry(
    entry: Omit<AddressBookEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<AddressBookEntry>;
  deleteAddressBookEntry(id: string, userId: string): Promise<boolean>;

  // Templates
  getTemplates(userId?: string): Promise<LetterTemplate[]>;
  saveTemplate(
    tmpl: Omit<LetterTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<LetterTemplate>;
  deleteTemplate(id: string, userId: string): Promise<boolean>;

  // Invoices
  getInvoices(userId?: string): Promise<TaxInvoice[]>;
  createTaxInvoice(params: {
    userId: string;
    totalAmountInr: number;
    paymentRef: string;
    gstin?: string | null;
    isInterstate?: boolean;
  }): Promise<TaxInvoice>;

  /** The only entry point that may move money in from a payment provider. */
  settlePaidOrder(input: SettlePaymentInput): Promise<SettlePaymentResult>;

  // Analytics & audit
  getAnalyticsData(): Promise<AnalyticsData>;
  logAudit(action: string, details?: string, userId?: string, ip?: string): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;
}
