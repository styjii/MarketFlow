import type { PaymentProvider, PaymentDetails } from "~/types/payment";

export type PaymentPayload = {
  provider: PaymentProvider;
  payment_details: PaymentDetails;
  external_id?: string; // transaction ID from provider
  shipping_address?: string;
};

