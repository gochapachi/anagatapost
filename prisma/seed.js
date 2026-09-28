/**
 * Seeds the rows the app needs to be usable against Postgres: the two demo
 * accounts the in-memory store used to invent at boot, the system letter
 * templates, and one address-book entry.
 *
 * Idempotent — every write is an upsert keyed on a stable id, so running it
 * twice (or against an existing database) is safe.
 *
 *   node prisma/seed.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/** Same five templates the in-memory store shipped with. */
const SYSTEM_TEMPLATES = [
  {
    id: "tmpl_s138_ni",
    title: "Section 138 NI Act Cheque Bounce Notice",
    description:
      "Statutory 15-day demand notice under Section 138 of Negotiable Instruments Act for cheque return.",
    category: "Legal",
    handwritingFont: "NONE",
    hasLetterhead: true,
    letterheadTitle: "LEGAL NOTICE & STATUTORY DEMAND",
    content: `LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

To,
[Recipient Name],
[Recipient Address]

Under instructions from and on behalf of my client [Client / Company Name], having their registered office at [Sender Address], I hereby serve upon you the following statutory legal notice:

1. That you had issued Cheque bearing No. [Cheque Number] dated [Cheque Date] drawn on [Bank Name, Branch] for an amount of Rs.[Amount in Figures] (Rupees [Amount in Words] only) towards the discharge of your legally enforceable debt.

2. That my client presented the said cheque for encashment, however the same was returned dishonoured by your bank vide Return Memo dated [Memo Date] with the endorsement: "FUNDS INSUFFICIENT".

3. You are hereby called upon to pay the said amount within fifteen (15) days from the date of receipt of this notice, failing which my client shall be constrained to initiate formal criminal proceedings against you under Section 138 and Section 142 of the Negotiable Instruments Act, 1881.

Copy kept for record.

Advocate for Client`,
  },
  {
    id: "tmpl_tenant_eviction",
    title: "Tenant Rent Default & Vacate Notice",
    description:
      "Notice to tenant regarding unpaid lease rentals and termination of tenancy under Transfer of Property Act.",
    category: "Real Estate",
    handwritingFont: "NONE",
    hasLetterhead: true,
    letterheadTitle: "NOTICE TO VACATE & TERMINATION OF LEASE",
    content: `NOTICE OF TERMINATION OF LEASE AND DEMAND FOR VACANT POSSESSION

Date: [Date]

To,
[Tenant Name],
[Rental Property Address]

Dear Sir/Madam,

Sub: Notice for non-payment of rent and termination of lease agreement dated [Agreement Date] in respect of premises [Full Address].

1. Under the terms of the Lease Agreement, you were required to remit monthly rent of Rs.[Monthly Rent] on or before the 5th day of every calendar month.

2. You have willfully defaulted in payment of rent for the past [Number of Months] months amounting to an aggregate default of Rs.[Total Due].

3. Take notice that your tenancy is hereby terminated. You are required to clear all arrears of rent and hand over peaceful, vacant possession of the premises to the undersigned within thirty (30) days of receipt of this notice.

Sincerely,
Landlord / Authorized Signatory`,
  },

  {
    id: "tmpl_b2b_demand",
    title: "B2B Outstanding Dues Recovery Demand",
    description:
      "Formal commercial demand notice for unpaid tax invoices with 18% MSME statutory interest warning.",
    category: "Corporate",
    handwritingFont: "NONE",
    hasLetterhead: true,
    letterheadTitle: "COMMERCIAL DEMAND NOTICE",
    content: `FINAL DEMAND NOTICE FOR PAYMENT OF OUTSTANDING COMMERCIAL INVOICES

To,
The Accounts & Finance Department,
[Company Name],
[Company Address]

Dear Sir / Madam,

Re: Outstanding Payment of Rs.[Total Outstanding Amount] against Invoice Nos. [Invoice Numbers].

We refer to the goods supplied and services rendered by us as per the acknowledged purchase orders. Despite multiple email reminders and account statements, your account reflects an overdue balance.

Under the provisions of the MSMED Act, 2006, payment was due within 45 days. You are requested to remit the outstanding sum immediately via NEFT/RTGS to our designated bank account within seven (7) banking days.

Failing timely settlement, we shall initiate formal recovery via the MSME Samadhaan portal and appropriate commercial courts.

Yours faithfully,
Finance Controller
[Sender Company Name]`,
  },
  {
    id: "tmpl_welcome_kit",
    title: "Executive Welcome Letter & Member Kit",
    description:
      "Elegant personalized welcome letter with warm cursive handwriting styling for VIP onboarding.",
    category: "Customer Success",
    handwritingFont: "CAVEAT",
    hasLetterhead: true,
    letterheadTitle: "ANAGATA POSTAL NETWORK",
    content: `Dear [Recipient First Name],

Welcome to our private circle! It is a distinct pleasure to have you with us.

Enclosed with this official Speed Post dispatch is your personalized welcome documentation, security badge, and emergency priority contact card.

We built this service to honour the timeless sanctity of physical paper mail in our fast-moving digital world. Should you ever need anything, our executive desk is always at your service.

With our warmest regards,
Founding Team, Anagata`,
  },
  {
    id: "tmpl_rti_application",
    title: "RTI Application (Right to Information Act 2005)",
    description:
      "Standard statutory format for information requests to Public Information Officers under RTI Act.",
    category: "Government",
    handwritingFont: "NONE",
    hasLetterhead: false,
    letterheadTitle: null,
    content: `APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To,
The Central / State Public Information Officer (CPIO / SPIO),
[Department / Ministry Name],
[Office Address, PIN Code]

1. Full Name of Applicant: [Applicant Name]
2. Address for Correspondence: [Applicant Address]
3. Particulars of Information Required:
   a) Subject matter of Information: [Subject]
   b) Period to which information pertains: [Financial Year / Dates]
   c) Description of Information sought: [Detailed points (i), (ii), (iii)]
4. Application Fee: Indian Postal Order (IPO) No. [IPO Number] for Rs.10 enclosed.

I state that I am a citizen of India and eligible to seek information under the RTI Act, 2005.

Place: [City]
Date: [Date]

Signature of Applicant`,
  },
];

/**
 * The demo accounts the in-memory store invented at boot. Passwords match the
 * documented demo credentials (admin123 / user123) and are hashed here rather
 * than shipped as a literal.
 */
const DEMO_USERS = [
  {
    id: "usr_admin",
    name: "Sanjeev (Operations Head)",
    email: "admin@anagataitsolutions.in",
    password: "admin123",
    role: "ADMIN",
    phone: "+919876543210",
    company: "Anagata IT Solutions",
    gstin: "29AAAAA0000A1Z5",
    balancePaise: 2500000, // Rs 25,000
  },
  {
    id: "usr_demo",
    name: "Advocate Rajesh Verma",
    email: "user@example.com",
    password: "user123",
    role: "USER",
    phone: "+919811223344",
    company: "Verma & Associates Legal",
    gstin: "07AAAAA0000A1Z5",
    balancePaise: 75000, // Rs 750
  },
];

async function seedUsers() {
  for (const user of DEMO_USERS) {
    const password = await bcrypt.hash(user.password, 10);
    const data = {
      name: user.name,
      email: user.email,
      password,
      role: user.role,
      phone: user.phone,
      company: user.company,
      gstin: user.gstin,
      balancePaise: user.balancePaise,
    };

    await prisma.user.upsert({ where: { id: user.id }, update: data, create: { id: user.id, ...data } });

    // The ledger is the audit trail: every balance has a matching entry whose
    // balanceAfterPaise equals the account balance.
    const existingEntry = await prisma.transaction.findFirst({
      where: { userId: user.id, referenceId: `seed:${user.id}` },
    });
    if (!existingEntry) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amountPaise: user.balancePaise,
          type: "CREDIT",
          description: "Seeded opening balance",
          referenceId: `seed:${user.id}`,
          balanceAfterPaise: user.balancePaise,
        },
      });
    }
  }
}

async function seedTemplates() {
  for (const tmpl of SYSTEM_TEMPLATES) {
    const data = {
      userId: null,
      title: tmpl.title,
      description: tmpl.description,
      category: tmpl.category,
      content: tmpl.content,
      handwritingFont: tmpl.handwritingFont,
      hasLetterhead: tmpl.hasLetterhead,
      letterheadTitle: tmpl.letterheadTitle,
      isSystem: true,
    };
    await prisma.letterTemplate.upsert({
      where: { id: tmpl.id },
      update: data,
      create: { id: tmpl.id, ...data },
    });
  }
}

async function seedAddressBook() {
  const entry = {
    id: "ab_demo_home",
    userId: "usr_demo",
    label: "Home",
    recipientName: "Anita Verma",
    recipientPhone: "+919811223344",
    recipientStreet: "14, M.G. Road",
    recipientLocality: "Ashok Nagar",
    recipientCity: "Bengaluru",
    recipientDistrict: "Bengaluru Urban",
    recipientState: "Karnataka",
    recipientPincode: "560001",
    isDefault: true,
  };
  await prisma.addressBookEntry.upsert({
    where: { id: entry.id },
    update: entry,
    create: entry,
  });
}

async function main() {
  await seedUsers();
  await seedTemplates();
  await seedAddressBook();
  console.log(
    `Seeded ${DEMO_USERS.length} users, ${SYSTEM_TEMPLATES.length} system templates, 1 address book entry.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

