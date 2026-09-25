import { PrismaClient } from "@prisma/client";
import { Letter, LetterStatus, DeliveryType, HandwritingFont } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// In-Memory store fallback for immediate plug-and-play testing before DB migration
class InMemoryStore {
  private letters: Map<string, Letter> = new Map();
  private userBalancePaise = 50000; // ₹500 default balance

  constructor() {
    this.seedSampleLetters();
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

    this.letters.set(sample1.id, sample1);
    this.letters.set(sample2.id, sample2);
  }

  async getLetters(): Promise<Letter[]> {
    return Array.from(this.letters.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  async getBalancePaise(): Promise<number> {
    return this.userBalancePaise;
  }

  async deductBalance(amountPaise: number): Promise<boolean> {
    if (this.userBalancePaise < amountPaise) return false;
    this.userBalancePaise -= amountPaise;
    return true;
  }

  async topupBalance(amountPaise: number): Promise<number> {
    this.userBalancePaise += amountPaise;
    return this.userBalancePaise;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var inMemoryStoreGlobal: InMemoryStore | undefined;
}

export const inMemoryStore =
  globalThis.inMemoryStoreGlobal ?? new InMemoryStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.inMemoryStoreGlobal = inMemoryStore;
}

