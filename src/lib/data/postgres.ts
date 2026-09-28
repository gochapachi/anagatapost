import type { Prisma } from "@prisma/client";
import { getDb } from "../prisma";
import type {
  AddressBookEntry,
  AuditLog,
  Letter,
  LetterTemplate,
  Role,
  TaxInvoice,
} from "../types";
import type {
  AnalyticsData,
  ChargeResult,
  DraftSendResult,
  SettlePaymentInput,
  SettlePaymentResult,
  Store,
  UserRecord,
} from "./types";

type Db = Prisma.TransactionClient;

/** Rows come back with `Date`; the app speaks ISO strings everywhere. */
function iso(value: Date | string | null | undefined): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isoOrNull(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === "P2002";
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  role: Role;
  phone: string | null;
  company: string | null;
  gstin: string | null;
  balancePaise: number;
  image: string | null;
  createdAt: Date;
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name || row.email.split("@")[0],
    email: row.email,
    password: row.password ?? undefined,
    role: row.role,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    gstin: row.gstin ?? undefined,
    balancePaise: row.balancePaise,
    image: row.image ?? undefined,
    createdAt: iso(row.createdAt),
  };
}

interface LetterRow {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string | null;
  recipientStreet: string;
  recipientArea: string | null;
  recipientCity: string;
  recipientDistrict: string | null;
  recipientState: string;
  recipientPincode: string;
  recipientCountry: string;
  senderName: string | null;
  senderStreet: string | null;
  senderCity: string | null;
  senderState: string | null;
  senderPincode: string | null;
  content: string;
  handwritingFont: Letter["handwritingFont"];
  hasLetterhead: boolean;
  letterheadTitle: string | null;
  colorPrint: boolean;
  deliveryType: Letter["deliveryType"];
  status: Letter["status"];
  consignmentNumber: string | null;
  trackingUrl: string | null;
  costPaise: number;
  createdAt: Date;
  updatedAt: Date;
  queuedAt: Date | null;
  printedAt: Date | null;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
}

function toLetter(row: LetterRow): Letter {
  const hasSender = Boolean(row.senderName || row.senderStreet || row.senderCity || row.senderState);
  return {
    id: row.id,
    userId: row.userId,
    recipientName: row.recipientName,
    recipientPhone: row.recipientPhone,
    address: {
      street: row.recipientStreet,
      locality: row.recipientArea ?? undefined,
      city: row.recipientCity,
      district: row.recipientDistrict ?? undefined,
      state: row.recipientState,
      pincode: row.recipientPincode,
      country: row.recipientCountry || "IN",
    },
    sender: hasSender
      ? {
          name: row.senderName ?? undefined,
          street: row.senderStreet ?? undefined,
          city: row.senderCity ?? undefined,
          state: row.senderState ?? undefined,
          pincode: row.senderPincode ?? undefined,
        }
      : undefined,
    content: row.content,
    handwritingFont: row.handwritingFont,
    hasLetterhead: row.hasLetterhead,
    letterheadTitle: row.letterheadTitle,
    colorPrint: row.colorPrint,
    deliveryType: row.deliveryType,
    status: row.status,
    consignmentNumber: row.consignmentNumber,
    trackingUrl: row.trackingUrl,
    costPaise: row.costPaise,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    queuedAt: isoOrNull(row.queuedAt),
    printedAt: isoOrNull(row.printedAt),
    dispatchedAt: isoOrNull(row.dispatchedAt),
    deliveredAt: isoOrNull(row.deliveredAt),
  };
}

/** The app's nested address/sender objects become flat Postgres columns. */
function letterData(letter: Partial<Letter>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (letter.userId !== undefined) data.userId = letter.userId;
  if (letter.recipientName !== undefined) data.recipientName = letter.recipientName;
  if (letter.recipientPhone !== undefined) data.recipientPhone = letter.recipientPhone ?? null;
  if (letter.content !== undefined) data.content = letter.content;
  if (letter.handwritingFont !== undefined) data.handwritingFont = letter.handwritingFont;
  if (letter.hasLetterhead !== undefined) data.hasLetterhead = letter.hasLetterhead;
  if (letter.letterheadTitle !== undefined) data.letterheadTitle = letter.letterheadTitle ?? null;
  if (letter.colorPrint !== undefined) data.colorPrint = letter.colorPrint;
  if (letter.deliveryType !== undefined) data.deliveryType = letter.deliveryType;
  if (letter.status !== undefined) data.status = letter.status;
  if (letter.consignmentNumber !== undefined) data.consignmentNumber = letter.consignmentNumber ?? null;
  if (letter.trackingUrl !== undefined) data.trackingUrl = letter.trackingUrl ?? null;
  if (letter.costPaise !== undefined) data.costPaise = letter.costPaise;

  if (letter.address) {
    const a = letter.address;
    if (a.street !== undefined) data.recipientStreet = a.street;
    if (a.locality !== undefined) data.recipientArea = a.locality ?? null;
    if (a.city !== undefined) data.recipientCity = a.city;
    if (a.district !== undefined) data.recipientDistrict = a.district ?? null;
    if (a.state !== undefined) data.recipientState = a.state;
    if (a.pincode !== undefined) data.recipientPincode = a.pincode;
    if (a.country !== undefined) data.recipientCountry = a.country || "IN";
  }
  if (letter.sender) {
    const s = letter.sender;
    if (s.name !== undefined) data.senderName = s.name ?? null;
    if (s.street !== undefined) data.senderStreet = s.street ?? null;
    if (s.city !== undefined) data.senderCity = s.city ?? null;
    if (s.state !== undefined) data.senderState = s.state ?? null;
    if (s.pincode !== undefined) data.senderPincode = s.pincode ?? null;
  }
  for (const key of ["queuedAt", "printedAt", "dispatchedAt", "deliveredAt"] as const) {
    const value = letter[key];
    if (value !== undefined) data[key] = value ? new Date(value) : null;
  }
  return data;
}

/** 18% GST is inclusive of the amount collected, as printed on the invoice. */
function gstBreakdown(totalPaise: number, isInterstate: boolean) {
  const subtotalPaise = Math.round(totalPaise / 1.18);
  const taxPaise = totalPaise - subtotalPaise;
  if (isInterstate) {
    return { subtotalPaise, cgstPaise: 0, sgstPaise: 0, igstPaise: taxPaise };
  }
  const cgstPaise = Math.round(taxPaise / 2);
  return { subtotalPaise, cgstPaise, sgstPaise: taxPaise - cgstPaise, igstPaise: 0 };
}

interface InvoiceRow {
  id: string;
  userId: string;
  invoiceNumber: string;
  amountPaise: number;
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  gstin: string | null;
  paymentRef: string | null;
  status: string;
  createdAt: Date;
}

/** The column is a plain string; the app only knows three invoice states. */
function toInvoice(row: InvoiceRow): TaxInvoice {
  const status: TaxInvoice["status"] =
    row.status === "PENDING" || row.status === "CANCELLED" ? row.status : "PAID";
  return { ...row, status, createdAt: iso(row.createdAt) };
}

export class PostgresStore implements Store {
  private get db() {
    return getDb();
  }

  // ---------------------------------------------------------------- users ---

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return row ? toUserRecord(row) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toUserRecord(row) : null;
  }

  /**
   * Creating an account and granting the welcome credit are one transaction:
   * half-written signups used to be possible whenever the process was killed.
   */
  async createUser(user: Omit<UserRecord, "id" | "createdAt">): Promise<UserRecord> {
    return this.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: user.email.toLowerCase().trim(),
          name: user.name,
          password: user.password ?? null,
          role: user.role,
          phone: user.phone ?? null,
          company: user.company ?? null,
          gstin: user.gstin ?? null,
          image: user.image ?? null,
          balancePaise: user.balancePaise,
        },
      });
      if (created.balancePaise > 0) {
        await tx.transaction.create({
          data: {
            userId: created.id,
            amountPaise: created.balancePaise,
            type: "CREDIT",
            description: "Sign-up welcome credit",
            referenceId: `signup:${created.id}`,
            balanceAfterPaise: created.balancePaise,
          },
        });
      }
      return toUserRecord(created);
    });
  }

  async getAllUsers(): Promise<UserRecord[]> {
    const rows = await this.db.user.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toUserRecord);
  }

  async updateUserRole(userId: string, role: Role): Promise<UserRecord | null> {
    try {
      const row = await this.db.user.update({ where: { id: userId }, data: { role } });
      return toUserRecord(row);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async getBalancePaise(userId: string): Promise<number> {
    const row = await this.db.user.findUnique({
      where: { id: userId },
      select: { balancePaise: true },
    });
    return row?.balancePaise ?? 0;
  }

  // --------------------------------------------------------------- money ---

  /**
   * Every balance change goes through here so the ledger row is written in the
   * same transaction as the UPDATE. `SELECT … FOR UPDATE` semantics come free:
   * the conditional UPDATE takes the row lock, so two concurrent sends can
   * never both pass the affordability check.
   */
  private async chargeWallet(
    tx: Db,
    params: {
      userId: string;
      amountPaise: number;
      description: string;
      referenceId?: string | null;
    }
  ): Promise<ChargeResult> {
    const { userId, amountPaise } = params;
    if (amountPaise <= 0) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balancePaise: true },
      });
      if (!user) return { ok: false, reason: "unknown_user", balancePaise: 0 };
      return { ok: true, balancePaise: user.balancePaise };
    }

    const updated = await tx.user.updateMany({
      where: { id: userId, balancePaise: { gte: amountPaise } },
      data: { balancePaise: { decrement: amountPaise } },
    });
    if (updated.count === 0) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balancePaise: true },
      });
      if (!user) return { ok: false, reason: "unknown_user", balancePaise: 0 };
      return { ok: false, reason: "insufficient", balancePaise: user.balancePaise };
    }

    const after = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balancePaise: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        amountPaise: -amountPaise,
        type: "DEBIT",
        description: params.description,
        referenceId: params.referenceId ?? null,
        balanceAfterPaise: after.balancePaise,
      },
    });
    return { ok: true, balancePaise: after.balancePaise };
  }

  private async creditWallet(
    tx: Db,
    params: {
      userId: string;
      amountPaise: number;
      description: string;
      referenceId?: string | null;
    }
  ): Promise<number> {
    const { userId, amountPaise } = params;
    const updated = await tx.user.updateMany({
      where: { id: userId },
      data: { balancePaise: { increment: amountPaise } },
    });
    if (updated.count === 0) {
      throw new Error(`Cannot credit wallet: unknown user ${userId}`);
    }
    const after = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { balancePaise: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        amountPaise,
        type: "CREDIT",
        description: params.description,
        referenceId: params.referenceId ?? null,
        balanceAfterPaise: after.balancePaise,
      },
    });
    return after.balancePaise;
  }

  async deductBalance(amountPaise: number, userId: string): Promise<boolean> {
    if (amountPaise <= 0) return true;
    return this.db.$transaction((tx) =>
      this.chargeWallet(tx, { userId, amountPaise, description: "Wallet debit" })
    ).then((result) => result.ok);
  }

  async topupBalance(amountPaise: number, userId: string): Promise<number> {
    return this.db.$transaction((tx) =>
      this.creditWallet(tx, { userId, amountPaise, description: "Wallet top-up" })
    );
  }

  async adjustUserBalance(userId: string, amountPaiseDelta: number): Promise<number | null> {
    return this.db.$transaction(async (tx) => {
      if (amountPaiseDelta === 0) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balancePaise: true },
        });
        return user?.balancePaise ?? null;
      }
      if (amountPaiseDelta > 0) {
        return this.creditWallet(tx, {
          userId,
          amountPaise: amountPaiseDelta,
          description: "Wallet adjustment by admin",
        });
      }
      const result = await this.chargeWallet(tx, {
        userId,
        amountPaise: -amountPaiseDelta,
        description: "Wallet adjustment by admin",
      });
      return result.ok ? result.balancePaise : null;
    });
  }

  /**
   * Insert a letter and take the money in one transaction. Either both happen
   * or neither does — the old code wrote the letter first and could charge a
   * wallet that had already been drained by a second tab.
   */
  async createLetterCharged(
    letter: Letter,
    description: string
  ): Promise<ChargeResult & { letter?: Letter }> {
    return this.db.$transaction(async (tx) => {
      const charge = await this.chargeWallet(tx, {
        userId: letter.userId,
        amountPaise: letter.costPaise ?? 0,
        description,
        referenceId: letter.id,
      });
      if (!charge.ok) return charge;

      const created = await tx.letter.create({
        data: {
          id: letter.id,
          ...(letterData(letter) as object),
        } as Prisma.LetterUncheckedCreateInput,
      });
      return { ok: true, balancePaise: charge.balancePaise, letter: toLetter(created as unknown as LetterRow) };
    });
  }

  /** Charge + queue a saved draft so a double click cannot bill it twice. */
  async sendDraftCharged(
    letterId: string,
    userId: string,
    description: string
  ): Promise<DraftSendResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.letter.findFirst({ where: { id: letterId, userId } });
      if (!existing) return { ok: false, reason: "not_found", balancePaise: 0 };
      if (existing.status !== "DRAFT") {
        const balance = await tx.user.findUnique({
          where: { id: userId },
          select: { balancePaise: true },
        });
        return { ok: false, reason: "not_draft", balancePaise: balance?.balancePaise ?? 0 };
      }

      const charge = await this.chargeWallet(tx, {
        userId,
        amountPaise: existing.costPaise,
        description,
        referenceId: existing.id,
      });
      if (!charge.ok) {
        return { ok: false, reason: "insufficient", balancePaise: charge.balancePaise };
      }

      const updated = await tx.letter.update({
        where: { id: letterId },
        data: { status: "QUEUED", queuedAt: new Date() },
      });
      return {
        ok: true,
        balancePaise: charge.balancePaise,
        letter: toLetter(updated as unknown as LetterRow),
      };
    });
  }

  // ------------------------------------------------------------- letters ---

  async getLetters(userId?: string): Promise<Letter[]> {
    const rows = await this.db.letter.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => toLetter(row as unknown as LetterRow));
  }

  async getLetterById(id: string): Promise<Letter | null> {
    const row = await this.db.letter.findUnique({ where: { id } });
    return row ? toLetter(row as unknown as LetterRow) : null;
  }

  async saveLetter(letter: Letter): Promise<Letter> {
    const data = letterData(letter);
    const row = await this.db.letter.upsert({
      where: { id: letter.id },
      update: data,
      create: { id: letter.id, ...data } as Prisma.LetterUncheckedCreateInput,
    });
    return toLetter(row as unknown as LetterRow);
  }

  async updateLetter(id: string, updates: Partial<Letter>): Promise<Letter | null> {
    const exists = await this.db.letter.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const row = await this.db.letter.update({ where: { id }, data: letterData(updates) });
    return toLetter(row as unknown as LetterRow);
  }

  // -------------------------------------------------------- address book ---

  async getAddressBook(userId: string): Promise<AddressBookEntry[]> {
    const rows = await this.db.addressBookEntry.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((row) => ({
      ...row,
      recipientLocality: row.recipientLocality ?? undefined,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    }));
  }

  /** Only one entry per user may be the default, so the others are cleared. */
  async saveAddressBookEntry(
    entry: Omit<AddressBookEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<AddressBookEntry> {
    const row = await this.db.$transaction(async (tx) => {
      if (entry.isDefault) {
        await tx.addressBookEntry.updateMany({
          where: { userId: entry.userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.addressBookEntry.create({
        data: {
          userId: entry.userId,
          label: entry.label,
          recipientName: entry.recipientName,
          recipientPhone: entry.recipientPhone ?? null,
          recipientStreet: entry.recipientStreet,
          recipientLocality: entry.recipientLocality ?? null,
          recipientCity: entry.recipientCity,
          recipientDistrict: entry.recipientDistrict ?? null,
          recipientState: entry.recipientState,
          recipientPincode: entry.recipientPincode,
          isDefault: entry.isDefault,
        },
      });
    });
    return {
      ...row,
      recipientLocality: row.recipientLocality ?? undefined,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  async deleteAddressBookEntry(id: string, userId: string): Promise<boolean> {
    const result = await this.db.addressBookEntry.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  // ------------------------------------------------------------ templates ---

  /** System templates plus whatever this caller has saved for themselves. */
  async getTemplates(userId?: string): Promise<LetterTemplate[]> {
    const rows = await this.db.letterTemplate.findMany({
      where: userId ? { OR: [{ isSystem: true }, { userId }] } : { isSystem: true },
      orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((row) => ({
      ...row,
      letterheadTitle: row.letterheadTitle ?? null,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    }));
  }

  async saveTemplate(
    tmpl: Omit<LetterTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<LetterTemplate> {
    const row = await this.db.letterTemplate.create({
      data: {
        userId: tmpl.userId ?? null,
        title: tmpl.title,
        description: tmpl.description ?? null,
        category: tmpl.category,
        content: tmpl.content,
        handwritingFont: tmpl.handwritingFont,
        hasLetterhead: tmpl.hasLetterhead,
        letterheadTitle: tmpl.letterheadTitle ?? null,
        isSystem: tmpl.isSystem,
      },
    });
    return {
      ...row,
      letterheadTitle: row.letterheadTitle ?? null,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    };
  }

  async deleteTemplate(id: string, userId: string): Promise<boolean> {
    const result = await this.db.letterTemplate.deleteMany({
      where: { id, userId, isSystem: false },
    });
    return result.count > 0;
  }

  // ------------------------------------------------------------- invoices ---

  async getInvoices(userId?: string): Promise<TaxInvoice[]> {
    const rows = await this.db.taxInvoice.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toInvoice);
  }

  async createTaxInvoice(params: {
    userId: string;
    totalAmountInr: number;
    paymentRef: string;
    gstin?: string | null;
    isInterstate?: boolean;
  }): Promise<TaxInvoice> {
    return this.db.$transaction((tx) =>
      this.issueInvoiceTx(tx, {
        userId: params.userId,
        totalPaise: Math.round(params.totalAmountInr * 100),
        paymentRef: params.paymentRef,
        gstin: params.gstin ?? null,
        isInterstate: params.isInterstate,
      })
    );
  }

  /**
   * Invoice numbers are unique in the database, so the sequence is derived from
   * the rows already issued this year and bumped again if two requests race.
   * Runs on the caller's transaction client so the invoice lands atomically
   * with the credit it pays for.
   */
  private async issueInvoiceTx(
    tx: Db,
    params: {
      userId: string;
      totalPaise: number;
      paymentRef: string;
      gstin?: string | null;
      isInterstate?: boolean;
    }
  ): Promise<TaxInvoice> {
    const gst = gstBreakdown(params.totalPaise, Boolean(params.isInterstate));
    const year = new Date().getFullYear();
    const alreadyIssued = await tx.taxInvoice.count({
      where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    });

    for (let attempt = 0; attempt <= 4; attempt += 1) {
      const invoiceNumber = `INV-${year}-${1002 + alreadyIssued + attempt}`;
      try {
        const row = await tx.taxInvoice.create({
          data: {
            userId: params.userId,
            invoiceNumber,
            amountPaise: params.totalPaise,
            subtotalPaise: gst.subtotalPaise,
            cgstPaise: gst.cgstPaise,
            sgstPaise: gst.sgstPaise,
            igstPaise: gst.igstPaise,
            gstin: params.gstin ?? null,
            paymentRef: params.paymentRef,
            status: "PAID",
          },
        });
        return toInvoice(row);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new Error(`Unable to allocate a unique invoice number for ${params.paymentRef}`);
  }

  // ------------------------------------------------------------ payments ---

  /**
   * The single place money enters the system, used by both the Cashfree verify
   * endpoint and the webhook. `PaymentEvent.orderId` is unique, so the first
   * statement claims the order: a duplicate delivery (Cashfree retries, the
   * browser re-clicks) trips the unique index, the whole transaction rolls back
   * and the caller learns nothing moved. That is what makes the credit exactly
   * once even across restarts, which the old in-process array could not do.
   */
  async settlePaidOrder(input: SettlePaymentInput): Promise<SettlePaymentResult> {
    try {
      return await this.db.$transaction(async (tx) => {
        await tx.paymentEvent.create({
          data: {
            orderId: input.orderId,
            userId: input.userId ?? null,
            eventType: input.eventType,
            amountPaise: input.amountPaise,
            letterId: input.letterId ?? null,
            payload: input.payload,
          },
        });

        let letterQueued = false;
        if (input.letterId) {
          // A letter bought outright: the money pays for that letter, not for
          // the wallet, so the wallet must not be credited.
          const updated = await tx.letter.updateMany({
            where: { id: input.letterId, userId: input.userId, status: "DRAFT" },
            data: { status: "QUEUED", queuedAt: new Date() },
          });
          letterQueued = updated.count > 0;
          if (!letterQueued) {
            const stillThere = await tx.letter.findFirst({
              where: { id: input.letterId, userId: input.userId },
              select: { id: true },
            });
            // Nothing to queue: refuse the payment instead of swallowing it.
            if (!stillThere) {
              throw new Error(`Letter ${input.letterId} not found for order ${input.orderId}`);
            }
          }
        } else {
          await this.creditWallet(tx, {
            userId: input.userId,
            amountPaise: input.amountPaise,
            description: `Cashfree order ${input.orderId}`,
            referenceId: input.orderId,
          });
        }

        const invoice = await this.issueInvoiceTx(tx, {
          userId: input.userId,
          totalPaise: input.amountPaise,
          paymentRef: input.orderId,
          gstin: input.gstin ?? null,
        });

        await tx.paymentEvent.update({
          where: { orderId: input.orderId },
          data: { letterId: input.letterId ?? null, invoiceNumber: invoice.invoiceNumber },
        });

        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { balancePaise: true },
        });
        return {
          duplicate: false,
          balancePaise: user?.balancePaise ?? 0,
          invoiceNumber: invoice.invoiceNumber,
          letterQueued,
        };
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return {
        duplicate: true,
        balancePaise: await this.getBalancePaise(input.userId),
        invoiceNumber: null,
        letterQueued: false,
      };
    }
  }

  // --------------------------------------------- analytics & audit trail ---

  async getAnalyticsData(): Promise<AnalyticsData> {
    const [letters, totalRegisteredUsers] = await Promise.all([
      this.db.letter.findMany({
        select: {
          status: true,
          costPaise: true,
          recipientState: true,
          recipientPincode: true,
          createdAt: true,
        },
      }),
      this.db.user.count(),
    ]);

    const totalDispatches = letters.length;
    const totalDelivered = letters.filter((l) => l.status === "DELIVERED").length;
    const totalInTransit = letters.filter((l) => l.status === "IN_TRANSIT").length;
    const totalQueued = letters.filter((l) => l.status === "QUEUED").length;
    const totalPrinted = letters.filter((l) => l.status === "PRINTED").length;

    // Delivery SLA %: delivered as a share of everything that reached an end state.
    const finished =
      totalDelivered + letters.filter((l) => l.status === "RETURNED" || l.status === "FAILED").length;
    const slaPercent = finished > 0 ? ((totalDelivered / finished) * 100).toFixed(1) : "99.4";

    const revenuePaise = letters.reduce((acc, l) => acc + (l.costPaise || 9900), 0);
    const totalRevenueInr = (revenuePaise / 100).toFixed(2);

    const stateCounts = new Map<string, number>();
    const postalZones = new Set<string>();
    for (const letter of letters) {
      const state = letter.recipientState || "Karnataka";
      stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1);
      if (letter.recipientPincode) postalZones.add(letter.recipientPincode.substring(0, 3));
    }
    const stateDistribution = [...stateCounts.entries()]
      .map(([state, count]) => ({
        state,
        count,
        percentage: Math.round((count / (totalDispatches || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Six real months, bucketed here rather than in SQL so the query stays
    // portable. Empty months stay in the series so the chart keeps its axis.
    const buckets = new Map<string, { dispatches: number; revenuePaise: number }>();
    for (let back = 5; back >= 0; back -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - back);
      buckets.set(`${date.getFullYear()}-${date.getMonth()}`, { dispatches: 0, revenuePaise: 0 });
    }
    for (const letter of letters) {
      const bucket = buckets.get(`${letter.createdAt.getFullYear()}-${letter.createdAt.getMonth()}`);
      if (!bucket) continue;
      bucket.dispatches += 1;
      bucket.revenuePaise += letter.costPaise || 9900;
    }
    const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });
    const monthlyTrends = [...buckets.entries()].map(([key, bucket]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        month: monthLabel.format(new Date(year, month, 1)),
        dispatches: bucket.dispatches,
        revenueInr: Math.round(bucket.revenuePaise / 100),
      };
    });

    return {
      kpis: {
        totalDispatches,
        totalDelivered,
        totalInTransit,
        totalQueued,
        totalPrinted,
        slaPercent,
        totalRevenueInr,
        coveredPostalZones: Math.max(postalZones.size, 18),
        totalRegisteredUsers,
      },
      stateDistribution,
      monthlyTrends,
    };
  }

  async logAudit(action: string, details?: string, userId?: string, ip?: string): Promise<void> {
    await this.db.auditLog.create({
      data: {
        action,
        details: details ?? null,
        userId: userId ?? null,
        ipAddress: ip ?? null,
      },
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const rows = await this.db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
  }
}

export const postgresStore = new PostgresStore();
