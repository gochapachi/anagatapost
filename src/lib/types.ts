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
