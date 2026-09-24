import type {
    CreateFundingInput,
    PaymentProviderCapabilities,
    ProviderFundingIntent,
    ProviderPaymentEvent,
    RefundInput,
    ReleaseInput,
} from "@/lib/payments/types";

/** Server-only contract implemented by the selected payment service adapter. */
export interface PaymentProvider {
    readonly name: string;
    getCapabilities(): PaymentProviderCapabilities;
    createFunding(input: CreateFundingInput): Promise<ProviderFundingIntent>;
    capture(providerPaymentId: string, amountMinor: number, currency: string, idempotencyKey: string): Promise<void>;
    refund(input: RefundInput): Promise<void>;
    releaseToRecipient(input: ReleaseInput): Promise<void>;
    verifyWebhook(rawBody: Uint8Array, headers: Headers): Promise<ProviderPaymentEvent>;
}
