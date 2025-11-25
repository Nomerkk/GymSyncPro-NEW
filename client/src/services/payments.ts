import { httpFetch } from "@/services/api";

export interface QrisPaymentResponse {
  orderId: string;
  qrString: string;
  expiresAt: string;
  amount: number;
}

export interface VaPaymentResponse {
  orderId: string;
  vaNumber: string;
  bank: string;
  expiresAt: string;
  amount: number;
}

export interface PaymentStatusResponse {
  status: string; // pending | completed | failed | expired
  orderId: string;
}

export const paymentsService = {
  async createQris(planId: string): Promise<QrisPaymentResponse> {
    const res = await httpFetch<QrisPaymentResponse>("/api/payment/qris", { method: "POST", body: { planId } });
    return res.json as QrisPaymentResponse;
  },
  async createVa(planId: string, bankCode: string): Promise<VaPaymentResponse> {
    const res = await httpFetch<VaPaymentResponse>("/api/payment/va", { method: "POST", body: { planId, bankCode } });
    return res.json as VaPaymentResponse;
  },
  async status(orderId: string): Promise<PaymentStatusResponse> {
    const res = await httpFetch<PaymentStatusResponse>(`/api/payment/status/${orderId}`, { method: "GET" });
    return res.json as PaymentStatusResponse;
  }
};
