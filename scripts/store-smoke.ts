/**
 * Money-path smoke test for the in-memory `Store` implementation.
 *
 * The Postgres store cannot be exercised without a database, but both
 * implementations are supposed to obey the same invariants: a send is either
 * charged and stored or does nothing, a draft is billed once, and a replayed
 * payment order is a no-op. This checks those on the store that always runs.
 *
 *     npm run smoke:store
 */
import { MemoryStore } from "../src/lib/data/memory";
import type { Letter } from "../src/lib/types";

function letter(userId: string, costPaise: number, status: Letter["status"]): Letter {
  return {
    id: `ltr_${userId}_${costPaise}_${status}`,
    userId,
    recipientName: "Test Recipient",
    recipientPhone: null,
    address: {
      street: "1 Test Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      country: "IN",
    },
    content: "hello",
    handwritingFont: "NONE",
    hasLetterhead: false,
    letterheadTitle: null,
    colorPrint: false,
    deliveryType: "SPEED_POST",
    status,
    trackingUrl: null,
    costPaise,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    queuedAt: status === "QUEUED" ? new Date().toISOString() : null,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok - ${message}`);
}

async function main(): Promise<void> {
  const store = new MemoryStore();

  const user = await store.createUser({
    name: "Smoke Tester",
    email: "smoke@example.com",
    password: "hash",
    role: "USER",
    phone: null,
    company: null,
    gstin: null,
    balancePaise: 10000,
  });
  assert(user.id.length > 0, "createUser returns an id");
  assert((await store.findUserByEmail("SMOKE@example.com "))?.id === user.id, "findUserByEmail normalises");

  // Sending a letter the wallet cannot afford must change nothing.
  const tooExpensive = letter(user.id, 50000, "QUEUED");
  const rejected = await store.createLetterCharged(tooExpensive, "too expensive");
  assert(rejected.ok === false && rejected.reason === "insufficient", "createLetterCharged refuses overdrafts");
  assert((await store.getBalancePaise(user.id)) === 10000, "a refused send leaves the balance alone");
  assert((await store.getLetterById(tooExpensive.id)) === null, "a refused send stores no letter");

  // An affordable send debits exactly the price and stores the letter.
  const affordable = letter(user.id, 3000, "QUEUED");
  const charged = await store.createLetterCharged(affordable, "smoke send");
  assert(charged.ok === true && charged.balancePaise === 7000, "createLetterCharged debits the price");
  assert((await store.getLetterById(affordable.id))?.status === "QUEUED", "the charged letter is stored");

  // A draft can only be sent once, and only by its owner.
  const draft = letter(user.id, 2000, "DRAFT");
  await store.saveLetter(draft);
  const foreign = await store.sendDraftCharged(draft.id, "usr_admin", "not mine");
  assert(foreign.ok === false && foreign.reason === "not_found", "sendDraftCharged enforces ownership");
  const first = await store.sendDraftCharged(draft.id, user.id, "first send");
  assert(first.ok === true && first.balancePaise === 5000, "sendDraftCharged debits once");
  const second = await store.sendDraftCharged(draft.id, user.id, "double click");
  assert(second.ok === false && second.reason === "not_draft", "a second send is refused");
  assert((await store.getBalancePaise(user.id)) === 5000, "the double send did not debit again");

  // Payment settlement: credited once, invoice issued, duplicate detected.
  const settled = await store.settlePaidOrder({
    orderId: "cf_order_smoke_1",
    userId: user.id,
    amountPaise: 123400,
    eventType: "PAYMENT_SUCCESS_WEBHOOK",
    payload: "{}",
  });
  assert(!settled.duplicate && settled.balancePaise === 128400, "settlePaidOrder credits the wallet");
  assert(settled.invoiceNumber !== null, "settlePaidOrder issues an invoice");
  const replay = await store.settlePaidOrder({
    orderId: "cf_order_smoke_1",
    userId: user.id,
    amountPaise: 123400,
    eventType: "PAYMENT_SUCCESS_WEBHOOK",
    payload: "{}",
  });
  assert(replay.duplicate === true, "a replayed order id is a no-op");
  assert((await store.getBalancePaise(user.id)) === 128400, "the replay credited nothing");
  assert((await store.getInvoices(user.id)).length === 1, "the replay issued no second invoice");

  // Ledger-ish surfaces used by the admin pages.
  const analytics = await store.getAnalyticsData();
  assert(analytics.kpis.totalDispatches >= 2, "analytics counts the stored letters");
  await store.logAudit("SMOKE", "ran", user.id, "127.0.0.1");
  assert((await store.getAuditLogs())[0]?.action === "SMOKE", "logAudit is readable back");

  console.log(process.exitCode ? "\nSMOKE FAILED" : "\nSMOKE PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
