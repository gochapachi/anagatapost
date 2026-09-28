import bcrypt from "bcryptjs";
import {
  Letter,
  LetterStatus,
  DeliveryType,
  HandwritingFont,
  AddressBookEntry,
  LetterTemplate,
  TaxInvoice,
  AuditLog,
  Role,
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

/**
 * The pre-PR-1 in-memory store, kept alive as a real `Store` implementation so a
 * laptop with no Postgres can still run the app end to end.
 *
 * It is single-process and loses everything on restart, which is exactly why
 * `src/lib/db.ts` only selects it when DATABASE_URL is absent — and production
 * refuses to boot in that state. The money helpers below are written without
 * `await` inside their critical sections, so a single request can never
 * interleave a read-modify-write the way a real database would.
 */
export class MemoryStore implements Store {
  private letters: Map<string, Letter> = new Map();
  private users: Map<string, UserRecord> = new Map();
  private addressBook: Map<string, AddressBookEntry> = new Map();
  private templates: Map<string, LetterTemplate> = new Map();
  private invoices: Map<string, TaxInvoice> = new Map();
  private auditLogs: AuditLog[] = [];
  private invoiceCounter = 1001;
  /** Order ids already settled: stands in for the unique index on PaymentEvent. */
  private settledOrders = new Set<string>();

  constructor() {
    this.seedDefaultUsers();
    this.seedSampleLetters();
    this.seedDefaultTemplates();
    this.seedDefaultAddressBook();
    this.seedSampleInvoices();
  }

  private seedDefaultUsers() {
    const adminHash = bcrypt.hashSync("admin123", 10);
    const userHash = bcrypt.hashSync("user123", 10);

    const adminUser: UserRecord = {
      id: "usr_admin",
      name: "Sanjeev (Operations Head)",
      email: "admin@anagataitsolutions.in",
      password: adminHash,
      role: "ADMIN",
      phone: "+919876543210",
      company: "Anagata IT Solutions",
      gstin: "29AAAAA0000A1Z5",
      balancePaise: 2500000, // ₹25,000
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    };

    const demoUser: UserRecord = {
      id: "usr_demo",
      name: "Advocate Rajesh Verma",
      email: "user@example.com",
      password: userHash,
      role: "USER",
      phone: "+919811223344",
      company: "Verma & Associates Legal",
      gstin: "07AAAAA0000A1Z5",
      balancePaise: 75000, // ₹750
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(demoUser.id, demoUser);
  }

  private seedDefaultTemplates() {
    const defaultTemplates: LetterTemplate[] = [
      {
        id: "tmpl_s138_ni",
        userId: null,
        title: "Section 138 NI Act Cheque Bounce Notice",
        description: "Statutory 15-day demand notice under Section 138 of Negotiable Instruments Act for cheque return.",
        category: "Legal",
        content: `LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881\n\nTo,\n[Recipient Name],\n[Recipient Address]\n\nUnder instructions from and on behalf of my client [Client / Company Name], having their registered office at [Sender Address], I hereby serve upon you the following statutory legal notice:\n\n1. That you had issued Cheque bearing No. [Cheque Number] dated [Cheque Date] drawn on [Bank Name, Branch] for an amount of ₹[Amount in Figures] (Rupees [Amount in Words] only) towards the discharge of your legally enforceable debt.\n\n2. That my client presented the said cheque for encashment, however the same was returned dishonoured by your bank vide Return Memo dated [Memo Date] with the endorsement: "FUNDS INSUFFICIENT".\n\n3. You are hereby called upon to pay the said amount of ₹[Amount] within fifteen (15) days from the date of receipt of this notice, failing which my client shall be constrained to initiate formal criminal proceedings against you under Section 138 and Section 142 of the Negotiable Instruments Act, 1881.\n\nCopy kept for record.\n\nAdvocate for Client`,
        handwritingFont: "NONE",
        hasLetterhead: true,
        letterheadTitle: "LEGAL NOTICE & STATUTORY DEMAND",
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tmpl_tenant_eviction",
        userId: null,
        title: "Tenant Rent Default & Vacate Notice",
        description: "Notice to tenant regarding unpaid lease rentals and termination of tenancy under Transfer of Property Act.",
        category: "Real Estate",
        content: `NOTICE OF TERMINATION OF LEASE AND DEMAND FOR VACANT POSSESSION\n\nDate: [Date]\n\nTo,\n[Tenant Name],\n[Rental Property Address]\n\nDear Sir/Madam,\n\nSub: Notice for non-payment of rent and termination of lease agreement dated [Agreement Date] in respect of premises [Full Address].\n\n1. Under the terms of the Lease Agreement, you were required to remit monthly rent of ₹[Monthly Rent] on or before the 5th day of every calendar month.\n\n2. You have willfully defaulted in payment of rent for the past [Number of Months] months amounting to an aggregate default of ₹[Total Due].\n\n3. Take notice that your tenancy is hereby terminated. You are required to clear all arrears of rent and hand over peaceful, vacant possession of the premises to the undersigned within thirty (30) days of receipt of this notice.\n\nSincerely,\nLandlord / Authorized Signatory`,
        handwritingFont: "NONE",
        hasLetterhead: true,
        letterheadTitle: "NOTICE TO VACATE & TERMINATION OF LEASE",
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tmpl_b2b_demand",
        userId: null,
        title: "B2B Outstanding Dues Recovery Demand",
        description: "Formal commercial demand notice for unpaid tax invoices with 18% MSME statutory interest warning.",
        category: "Corporate",
        content: `FINAL DEMAND NOTICE FOR PAYMENT OF OUTSTANDING COMMERCIAL INVOICES\n\nTo,\nThe Accounts & Finance Department,\n[Company Name],\n[Company Address]\n\nDear Sir / Madam,\n\nRe: Outstanding Payment of ₹[Total Outstanding Amount] against Invoice Nos. [Invoice Numbers].\n\nWe refer to the goods supplied and services rendered by us as per the acknowledged purchase orders. Despite multiple email reminders and account statements, your account reflects an overdue balance of ₹[Amount].\n\nUnder the provisions of the MSMED Act, 2006, payment was due within 45 days. You are requested to remit the outstanding sum of ₹[Amount] immediately via NEFT/RTGS to our designated bank account within seven (7) banking days.\n\nFailing timely settlement, we shall initiate formal recovery via the MSME Samadhaan portal and appropriate commercial courts.\n\nYours faithfully,\nFinance Controller\n[Sender Company Name]`,
        handwritingFont: "NONE",
        hasLetterhead: true,
        letterheadTitle: "COMMERCIAL DEMAND NOTICE",
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tmpl_welcome_kit",
        userId: null,
        title: "Executive Welcome Letter & Member Kit",
        description: "Elegant personalized welcome letter with warm cursive handwriting styling for VIP onboarding.",
        category: "Customer Success",
        content: `Dear [Recipient First Name],\n\nWelcome to our private circle! It is a distinct pleasure to have you with us.\n\nEnclosed with this official Speed Post dispatch is your personalized welcome documentation, cryptographic security badge, and emergency priority contact card.\n\nWe built this service to honour the timeless sanctity of physical paper mail in our fast-moving digital world. Should you ever need anything, our executive desk is always at your service.\n\nWith our warmest regards,\nFounding Team, Anagata`,
        handwritingFont: "CAVEAT",
        hasLetterhead: true,
        letterheadTitle: "ANAGATA POSTAL NETWORK",
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "tmpl_rti_application",
        userId: null,
        title: "RTI Application (Right to Information Act 2005)",
        description: "Standard statutory format for information requests to Public Information Officers under RTI Act.",
        category: "Government",
        content: `APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005\n\nTo,\nThe Central / State Public Information Officer (CPIO / SPIO),\n[Department / Ministry Name],\n[Office Address, PIN Code]\n\n1. Full Name of Applicant: [Applicant Name]\n2. Address for Correspondence: [Applicant Address]\n3. Particulars of Information Required:\n   a) Subject matter of Information: [Subject]\n   b) Period to which information pertains: [Financial Year / Dates]\n   c) Description of Information sought: [Detailed points (i), (ii), (iii)]\n4. Application Fee: Indian Postal Order (IPO) No. [IPO Number] for ₹10 enclosed.\n\nI state that I am a citizen of India and eligible to seek information under the RTI Act, 2005.\n\nPlace: [City]\nDate: [Date]\n\nSignature of Applicant`,
        handwritingFont: "NONE",
        hasLetterhead: false,
        letterheadTitle: null,
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const t of defaultTemplates) {
      this.templates.set(t.id, t);
    }
  }

  private seedDefaultAddressBook() {
    const contacts: AddressBookEntry[] = [
      {
        id: "addr_1",
        userId: "usr_demo",
        label: "Bengaluru HQ",
        recipientName: "Aditi Sharma (VP Operations)",
        recipientPhone: "+919876543210",
        recipientStreet: "Flat 402, Shanti Nilayam, 5th Cross",
        recipientLocality: "Koramangala 4th Block",
        recipientCity: "Bengaluru",
        recipientDistrict: "Bengaluru Urban",
        recipientState: "Karnataka",
        recipientPincode: "560034",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "addr_2",
        userId: "usr_demo",
        label: "Delhi Legal Chambers",
        recipientName: "Vikram Malhotra & Associates",
        recipientPhone: "+919811223344",
        recipientStreet: "Chamber No. 14, Delhi High Court Complex",
        recipientLocality: "Sher Shah Road",
        recipientCity: "New Delhi",
        recipientDistrict: "New Delhi",
        recipientState: "Delhi",
        recipientPincode: "110003",
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "addr_3",
        userId: "usr_demo",
        label: "Mumbai Corporate",
        recipientName: "Pooja Deshmukh (Finance Director)",
        recipientPhone: "+919820011223",
        recipientStreet: "Floor 12, Express Towers, Nariman Point",
        recipientLocality: "Marine Drive",
        recipientCity: "Mumbai",
        recipientDistrict: "Mumbai City",
        recipientState: "Maharashtra",
        recipientPincode: "400021",
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const c of contacts) {
      this.addressBook.set(c.id, c);
    }
  }

  private seedSampleLetters() {
    const sample1: Letter = {
      id: "ltr_blr_982143",
      userId: "usr_demo",
      recipientName: "Aditi Sharma",
      recipientPhone: "9876543210",
      address: {
        street: "Flat 402, Shanti Nilayam, 5th Cross",
        locality: "Koramangala 4th Block",
        city: "Bengaluru",
        district: "Bengaluru Urban",
        state: "Karnataka",
        pincode: "560034",
        country: "IN",
      },
      sender: {
        name: "Anagata Technologies Pvt Ltd",
        street: "Tech Hub, Inner Ring Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560071",
      },
      content: `Dear Aditi,\n\nWe are delighted to welcome you to the Anagata Private Beta! Your physical welcome kit and security token certificate are enclosed with this formal Speed Post notice.\n\nThank you for trusting Bharat's modern postal infrastructure.\n\nWarm regards,\nFounder, AnagataPost`,
      handwritingFont: "CAVEAT",
      hasLetterhead: true,
      letterheadTitle: "ANAGATA POSTAL NETWORK",
      colorPrint: true,
      deliveryType: "SPEED_POST",
      status: "IN_TRANSIT",
      consignmentNumber: "ED839201948IN",
      trackingUrl: "/track/ltr_blr_982143",
      costPaise: 9900,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      queuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      printedAt: new Date(Date.now() - 86400000).toISOString(),
      dispatchedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    };

    const sample2: Letter = {
      id: "ltr_del_441029",
      userId: "usr_demo",
      recipientName: "Vikram Malhotra & Legal Associates",
      recipientPhone: "9811223344",
      address: {
        street: "Chamber No. 14, Delhi High Court Complex",
        locality: "Sher Shah Road",
        city: "New Delhi",
        district: "New Delhi",
        state: "Delhi",
        pincode: "110003",
        country: "IN",
      },
      sender: {
        name: "Corporate Counsel, Fintech Hub",
        street: "DLF Cyber City, Tower B",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122002",
      },
      content: `LEGAL NOTICE UNDER SECTION 138 NEGOTIABLE INSTRUMENTS ACT\n\nTo,\nMr. Vikram Malhotra,\n\nTake notice that the cheque bearing no. 004812 drawn on HDFC Bank has been returned unpaid with remarks "Funds Insufficient". You are hereby called upon to remit the sum of ₹1,45,000 within fifteen (15) days of receipt of this registered notice.\n\nFailure to comply shall initiate formal criminal proceedings.\n\nIssued on behalf of Client.`,
      handwritingFont: "NONE",
      hasLetterhead: true,
      letterheadTitle: "ADVOCATE CHAMBERS & LEGAL SOLICITORS",
      colorPrint: false,
      deliveryType: "REGISTERED_POST",
      status: "DELIVERED",
      consignmentNumber: "RL559281034IN",
      trackingUrl: "/track/ltr_del_441029",
      costPaise: 12900,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      queuedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      printedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      dispatchedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      deliveredAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    };

    const sample3: Letter = {
      id: "ltr_bom_110942",
      userId: "usr_admin",
      recipientName: "Pooja Deshmukh",
      recipientPhone: "9820011223",
      address: {
        street: "Floor 12, Express Towers, Nariman Point",
        locality: "Marine Drive",
        city: "Mumbai",
        district: "Mumbai City",
        state: "Maharashtra",
        pincode: "400021",
        country: "IN",
      },
      sender: {
        name: "Operations Central Hub",
        street: "Koramangala 4th Block",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560034",
      },
      content: `COMMERCIAL NOTICE OF ANNUAL AUDIT CLEARANCE\n\nTo,\nPooja Deshmukh,\n\nWe hereby certify that all commercial transactions and tax invoices for FY 2025-26 have been satisfactorily reconciled and audited. A physical copy of the statutory compliance certificate is enclosed.\n\nBest Regards,\nAudit Committee`,
      handwritingFont: "NONE",
      hasLetterhead: true,
      letterheadTitle: "ANAGATA POSTAL NETWORK",
      colorPrint: true,
      deliveryType: "SPEED_POST",
      status: "QUEUED",
      consignmentNumber: null,
      trackingUrl: "/track/ltr_bom_110942",
      costPaise: 9900,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      queuedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    };

    this.letters.set(sample1.id, sample1);
    this.letters.set(sample2.id, sample2);
    this.letters.set(sample3.id, sample3);
  }

  private seedSampleInvoices() {
    const inv1: TaxInvoice = {
      id: "inv_1001",
      userId: "usr_demo",
      invoiceNumber: "INV-2026-1001",
      amountPaise: 118000, // ₹1,180 total
      subtotalPaise: 100000, // ₹1,000 base
      cgstPaise: 9000, // 9% ₹90
      sgstPaise: 9000, // 9% ₹90
      igstPaise: 0,
      gstin: "07AAAAA0000A1Z5",
      paymentRef: "cf_order_998124",
      status: "PAID",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    };
    this.invoices.set(inv1.id, inv1);
  }

  // User management
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  async createUser(user: Omit<UserRecord, "id" | "createdAt">): Promise<UserRecord> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: UserRecord = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, record);
    return record;
  }

  async getAllUsers(): Promise<UserRecord[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(userId: string, role: Role): Promise<UserRecord | null> {
    const u = this.users.get(userId);
    if (!u) return null;
    u.role = role;
    this.users.set(userId, u);
    return u;
  }

  async adjustUserBalance(userId: string, amountPaiseDelta: number): Promise<number | null> {
    const u = this.users.get(userId);
    if (!u) return null;
    u.balancePaise = Math.max(0, u.balancePaise + amountPaiseDelta);
    this.users.set(userId, u);
    return u.balancePaise;
  }

  async getBalancePaise(userId: string = "usr_demo"): Promise<number> {
    const u = this.users.get(userId);
    return u ? u.balancePaise : 50000;
  }

  async deductBalance(amountPaise: number, userId: string = "usr_demo"): Promise<boolean> {
    const u = this.users.get(userId);
    if (!u) return false;
    if (u.balancePaise < amountPaise) return false;
    u.balancePaise -= amountPaise;
    this.users.set(userId, u);
    return true;
  }

  async topupBalance(amountPaise: number, userId: string = "usr_demo"): Promise<number> {
    const u = this.users.get(userId);
    if (u) {
      u.balancePaise += amountPaise;
      this.users.set(userId, u);
      return u.balancePaise;
    }
    return 50000 + amountPaise;
  }

  // Letters
  async getLetters(userId?: string): Promise<Letter[]> {
    const all = Array.from(this.letters.values());
    if (userId) {
      return all
        .filter((l) => l.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLetterById(id: string): Promise<Letter | null> {
    return this.letters.get(id) || null;
  }

  async saveLetter(letter: Letter): Promise<Letter> {
    this.letters.set(letter.id, letter);
    return letter;
  }

  async updateLetter(id: string, updates: Partial<Letter>): Promise<Letter | null> {
    const existing = this.letters.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.letters.set(id, updated);
    return updated;
  }

  // Address Book
  async getAddressBook(userId: string): Promise<AddressBookEntry[]> {
    return Array.from(this.addressBook.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }

  async saveAddressBookEntry(
    entry: Omit<AddressBookEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<AddressBookEntry> {
    const id = `addr_${Date.now()}`;
    const newEntry: AddressBookEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (newEntry.isDefault) {
      for (const a of this.addressBook.values()) {
        if (a.userId === entry.userId) a.isDefault = false;
      }
    }
    this.addressBook.set(id, newEntry);
    return newEntry;
  }

  async deleteAddressBookEntry(id: string, userId: string): Promise<boolean> {
    const entry = this.addressBook.get(id);
    if (!entry || entry.userId !== userId) return false;
    return this.addressBook.delete(id);
  }

  // Templates
  async getTemplates(userId?: string): Promise<LetterTemplate[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.isSystem || (userId && t.userId === userId)
    );
  }

  async saveTemplate(
    tmpl: Omit<LetterTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<LetterTemplate> {
    const id = `tmpl_${Date.now()}`;
    const newTmpl: LetterTemplate = {
      ...tmpl,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(id, newTmpl);
    return newTmpl;
  }

  async deleteTemplate(id: string, userId: string): Promise<boolean> {
    const tmpl = this.templates.get(id);
    if (!tmpl || tmpl.isSystem || tmpl.userId !== userId) return false;
    return this.templates.delete(id);
  }

  // Tax Invoices (GST 18% Compliant)
  async getInvoices(userId?: string): Promise<TaxInvoice[]> {
    const all = Array.from(this.invoices.values());
    if (userId) {
      return all
        .filter((i) => i.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTaxInvoice(params: {
    userId: string;
    totalAmountInr: number;
    paymentRef: string;
    gstin?: string | null;
    isInterstate?: boolean;
  }): Promise<TaxInvoice> {
    this.invoiceCounter += 1;
    const invoiceNumber = `INV-2026-${this.invoiceCounter}`;
    const totalPaise = Math.round(params.totalAmountInr * 100);
    // 18% GST inclusive calculation: subtotal = total / 1.18
    const subtotalPaise = Math.round(totalPaise / 1.18);
    const taxPaise = totalPaise - subtotalPaise;

    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;

    if (params.isInterstate) {
      igstPaise = taxPaise;
    } else {
      cgstPaise = Math.round(taxPaise / 2);
      sgstPaise = taxPaise - cgstPaise;
    }

    const invoice: TaxInvoice = {
      id: `inv_${Date.now()}`,
      userId: params.userId,
      invoiceNumber,
      amountPaise: totalPaise,
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      igstPaise,
      gstin: params.gstin || null,
      paymentRef: params.paymentRef,
      status: "PAID",
      createdAt: new Date().toISOString(),
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  // Payments

  /**
   * The Postgres implementation claims `PaymentEvent.orderId` first, so a
   * duplicate delivery credits nothing. This is the same shape over a Set: it
   * holds for the life of the process, which is the one guarantee a memory
   * store cannot make — a restart re-opens the door.
   */
  async settlePaidOrder(input: SettlePaymentInput): Promise<SettlePaymentResult> {
    const balanceNow = () => this.users.get(input.userId)?.balancePaise ?? 0;
    if (this.settledOrders.has(input.orderId)) {
      return {
        duplicate: true,
        balancePaise: balanceNow(),
        invoiceNumber: null,
        letterQueued: false,
      };
    }
    this.settledOrders.add(input.orderId);

    let letterQueued = false;
    if (input.letterId) {
      const letter = this.letters.get(input.letterId);
      if (!letter || letter.userId !== input.userId) {
        // Nothing to queue: refuse the payment rather than swallow the money.
        this.settledOrders.delete(input.orderId);
        throw new Error(`Letter ${input.letterId} not found for order ${input.orderId}`);
      }
      if (letter.status === "DRAFT") {
        letter.status = "QUEUED";
        letter.queuedAt = new Date().toISOString();
        letter.updatedAt = letter.queuedAt;
        letterQueued = true;
      }
    } else {
      const user = this.users.get(input.userId);
      if (user) user.balancePaise += input.amountPaise;
    }

    const invoice = await this.createTaxInvoice({
      userId: input.userId,
      totalAmountInr: input.amountPaise / 100,
      paymentRef: input.orderId,
      gstin: input.gstin ?? null,
    });

    return {
      duplicate: false,
      balancePaise: balanceNow(),
      invoiceNumber: invoice.invoiceNumber,
      letterQueued,
    };
  }

  /** Take the money and store the letter, or do neither. */
  async createLetterCharged(
    letter: Letter,
    description: string
  ): Promise<ChargeResult & { letter?: Letter }> {
    const user = this.users.get(letter.userId);
    if (!user) return { ok: false, reason: "unknown_user", balancePaise: 0 };
    const cost = letter.costPaise ?? 0;
    if (user.balancePaise < cost) {
      return { ok: false, reason: "insufficient", balancePaise: user.balancePaise };
    }
    user.balancePaise -= cost;
    this.letters.set(letter.id, letter);
    return { ok: true, balancePaise: user.balancePaise, letter };
  }

  /** Charge a draft and queue it; a second call finds it is no longer a draft. */
  async sendDraftCharged(
    letterId: string,
    userId: string,
    description: string
  ): Promise<DraftSendResult> {
    const balancePaise = this.users.get(userId)?.balancePaise ?? 0;
    const letter = this.letters.get(letterId);
    if (!letter || letter.userId !== userId) {
      return { ok: false, reason: "not_found", balancePaise };
    }
    if (letter.status !== "DRAFT") {
      return { ok: false, reason: "not_draft", balancePaise };
    }
    if (balancePaise < letter.costPaise) {
      return { ok: false, reason: "insufficient", balancePaise };
    }
    this.users.get(userId)!.balancePaise -= letter.costPaise;
    letter.status = "QUEUED";
    letter.queuedAt = new Date().toISOString();
    letter.updatedAt = letter.queuedAt;
    return { ok: true, balancePaise: this.users.get(userId)!.balancePaise, letter };
  }

  // Audit Logs
  async logAudit(action: string, details?: string, userId?: string, ip?: string): Promise<void> {
    this.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      details: details || null,
      userId: userId || null,
      ipAddress: ip || null,
      createdAt: new Date().toISOString(),
    });
    // Keep last 500 logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs;
  }

  // Analytics & KPI metrics
  async getAnalyticsData() {
    const letters = Array.from(this.letters.values());
    const totalDispatches = letters.length;
    const totalDelivered = letters.filter((l) => l.status === "DELIVERED").length;
    const totalInTransit = letters.filter((l) => l.status === "IN_TRANSIT").length;
    const totalQueued = letters.filter((l) => l.status === "QUEUED").length;
    const totalPrinted = letters.filter((l) => l.status === "PRINTED").length;

    // Delivery SLA %
    const finishedLetters = totalDelivered + letters.filter((l) => l.status === "RETURNED" || l.status === "FAILED").length;
    const slaSuccessPercent = finishedLetters > 0 ? ((totalDelivered / finishedLetters) * 100).toFixed(1) : "99.4";

    // Revenue calculation
    const totalRevenuePaise = letters.reduce((acc, l) => acc + (l.costPaise || 9900), 0);
    const totalRevenueInr = (totalRevenuePaise / 100).toFixed(2);

    // State distribution
    const stateCountMap: Record<string, number> = {};
    const pinCoverageSet = new Set<string>();

    for (const ltr of letters) {
      const state = ltr.address?.state || "Karnataka";
      stateCountMap[state] = (stateCountMap[state] || 0) + 1;
      if (ltr.address?.pincode) {
        pinCoverageSet.add(ltr.address.pincode.substring(0, 3)); // 3 digit postal zone prefix
      }
    }

    const stateDistribution = Object.entries(stateCountMap).map(([state, count]) => ({
      state,
      count,
      percentage: Math.round((count / (totalDispatches || 1)) * 100),
    })).sort((a, b) => b.count - a.count);

    return {
      kpis: {
        totalDispatches,
        totalDelivered,
        totalInTransit,
        totalQueued,
        totalPrinted,
        slaPercent: slaSuccessPercent,
        totalRevenueInr,
        coveredPostalZones: Math.max(pinCoverageSet.size, 18),
        totalRegisteredUsers: this.users.size,
      },
      stateDistribution,
      monthlyTrends: [
        { month: "Jan 2026", dispatches: 142, revenueInr: 14058 },
        { month: "Feb 2026", dispatches: 289, revenueInr: 28611 },
        { month: "Mar 2026", dispatches: 412, revenueInr: 40788 },
        { month: "Current", dispatches: totalDispatches, revenueInr: Number(totalRevenueInr) },
      ],
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var memoryStoreGlobal: MemoryStore | undefined;
}

/** Hot-reload safe singleton so a dev refresh keeps the seeded demo data. */
export const memoryStore = globalThis.memoryStoreGlobal ?? new MemoryStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.memoryStoreGlobal = memoryStore;
}
