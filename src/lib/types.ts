export type Role = "USER" | "ADMIN" | "PRINT_PARTNER";

export type DeliveryType = "SPEED_POST" | "REGISTERED_POST" | "STANDARD";

export type LetterStatus =
  | "DRAFT"
  | "QUEUED"
  | "PRINTED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RETURNED"
  | "FAILED";

export type HandwritingFont = "NONE" | "CAVEAT" | "KALAM" | "SACRAMENTO";

export interface IndianPostalAddress {
  street: string;
  locality?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string; // 6-digit Indian PIN code
  country?: string; // Default: "IN"
}

export interface LetterSender {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Letter {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone?: string | null;
  address: IndianPostalAddress;
  sender?: LetterSender;
  content: string;
  handwritingFont: HandwritingFont;
  hasLetterhead: boolean;
  letterheadTitle?: string | null;
  colorPrint: boolean;
  deliveryType: DeliveryType;
  status: LetterStatus;
  consignmentNumber?: string | null;
  trackingUrl?: string | null;
  costPaise: number;
  createdAt: string;
  updatedAt: string;
  queuedAt?: string | null;
  printedAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
}

export interface CreateLetterPayload {
  recipient: string;
  phone?: string;
  address: {
    street: string;
    locality?: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
    country?: string;
  };
  sender?: LetterSender;
  content: string;
  handwriting?: boolean | HandwritingFont;
  letterhead?: boolean | string;
  color?: boolean;
  delivery_type?: DeliveryType;
  send?: boolean; // true sends immediately, false saves as draft
}

export interface PincodeInfo {
  pincode: string;
  postOffice: string;
  district: string;
  state: string;
  circle: string;
}

export interface EvolutionWhatsAppPayload {
  number: string;
  message: string;
  mediaUrl?: string;
}

export interface AddressBookEntry {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  recipientPhone?: string | null;
  recipientStreet: string;
  recipientLocality?: string | null;
  recipientCity: string;
  recipientDistrict?: string | null;
  recipientState: string;
  recipientPincode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LetterTemplate {
  id: string;
  userId?: string | null;
  title: string;
  description?: string | null;
  category: string;
  content: string;
  handwritingFont: HandwritingFont;
  hasLetterhead: boolean;
  letterheadTitle?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  amountPaise: number;
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  gstin?: string | null;
  paymentRef?: string | null;
  status: "PAID" | "PENDING" | "CANCELLED";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface UserSessionProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  balanceInr: string;
  company?: string | null;
  gstin?: string | null;
}
