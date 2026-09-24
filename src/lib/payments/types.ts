export type ProviderPaymentState =
  | "REQUIRES_ACTION"
  | "AUTHORIZED"
  | "CAPTURED"
  | "HELD"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "RELEASE_PENDING"
  | "RELEASED"
  | "FAILED";

export type PaymentProviderCapabilities = {
  supportedCurrencies: readonly string[];
  authorizationHold: boolean;
  delayedRecipientPayout: boolean;
  webhooks: boolean;
  maximumHoldDays: number | null;
};

export type CreateFundingInput = {
  paymentId: string;
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  returnUrl: string;
};

export type ProviderFundingIntent = {
  providerPaymentId: string;
  state: "REQUIRES_ACTION" | "AUTHORIZED" | "CAPTURED" | "HELD";
  checkoutUrl?: string;
};

export type ProviderPaymentEvent = {
  providerEventId: string;
  providerPaymentId: string;
  state: ProviderPaymentState;
  amountMinor: number;
  currency: string;
  occurredAt: Date;
  safeSummary?: Record<string, string | number | boolean | null>;
};

export type ReleaseInput = {
  providerPaymentId: string;
  recipientReference: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
};

export type RefundInput = {
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
};
