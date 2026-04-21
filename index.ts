import QRCode from "qrcode";
import { encode } from "bysquare";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }

    if (request.method !== "POST") {
      return new Response("Only POST", { status: 405, headers: cors() });
    }

    try {
      const body = await request.json();

      const amount = Number(body.amount);
      const iban = String(body.iban || "").replace(/\s+/g, "").toUpperCase();
      const beneficiaryName = String(body.beneficiaryName || "").trim();
      const variableSymbol = String(body.variableSymbol || "").trim();
      const specificSymbol = String(body.specificSymbol || "").trim();
      const constantSymbol = String(body.constantSymbol || "").trim();
      const paymentNote = String(body.paymentNote || "").trim();
      const currencyCode = String(body.currencyCode || "EUR").toUpperCase();
      const bic = String(body.bic || "").trim().toUpperCase();

      if (!amount || !iban || !beneficiaryName) {
        return json({ error: "Missing data" }, 400);
      }

      const today = new Date();
      const dueDate =
        today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, "0") +
        String(today.getDate()).padStart(2, "0");

      const payload = encode({
        payments: [
          {
            type: "paymentorder",
            amount: amount.toFixed(2),
            currencyCode,
            date: dueDate,
            variableSymbol: variableSymbol || undefined,
            specificSymbol: specificSymbol || undefined,
            constantSymbol: constantSymbol || undefined,
            paymentNote: paymentNote || undefined,
            bankAccounts: [
              {
                iban,
                bic: bic || undefined
              }
            ]
          }
        ]
      });

      const svg = await QRCode.toString(payload, {
        type: "svg",
        width: 300
      });

      return json({
        svg,
        payload,
        format: "PAY_BY_SQUARE"
      });
    } catch (e: any) {
      return json({ error: e.message || "Server error" }, 500);
    }
  }
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...cors()
    }
  });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}