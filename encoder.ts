import QRCode from "qrcode";
import { encode, PaymentOptions, CurrencyCode } from "bysquare/pay";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return new Response("Only POST", {
        status: 405,
        headers: corsHeaders()
      });
    }

    try {
      const body = await request.json();

      const amount = Number(body.amount);

      const iban = String(body.iban || "")
        .replace(/\s+/g, "")
        .toUpperCase();

      // 🔥 fallback: beneficiaryName → companyName
      const beneficiaryName = String(
        body.beneficiaryName || body.companyName || ""
      ).trim();

      const variableSymbol = String(body.variableSymbol || "").trim();
      const specificSymbol = String(body.specificSymbol || "").trim();
      const constantSymbol = String(body.constantSymbol || "").trim();

      // 📅 dátum splatnosti (YYYY-MM-DD → YYYYMMDD)
      let dueDate = String(body.dueDate || "").trim();
      if (dueDate) {
        dueDate = dueDate.replace(/-/g, "");
      }

      const paymentNote = String(body.paymentNote || "").trim();

      const bic = String(body.bic || "")
        .trim()
        .toUpperCase();

      // ✅ VALIDÁCIA
      if (!amount || amount <= 0) {
        return json({ error: "Chýba alebo je neplatná suma." }, 400);
      }

      if (!iban) {
        return json({ error: "Chýba IBAN." }, 400);
      }

      if (!beneficiaryName) {
        return json({ error: "Chýba názov príjemcu." }, 400);
      }

      // ✅ BYSQUARE
      const bySquareString = encode({
        invoiceId: String(Date.now()),
        payments: [
          {
            type: PaymentOptions.PaymentOrder,
            amount,
            currencyCode: CurrencyCode.EUR,

            bankAccounts: [
              bic ? { iban, bic } : { iban }
            ],

            variableSymbol: variableSymbol || undefined,
            specificSymbol: specificSymbol || undefined,
            constantSymbol: constantSymbol || undefined,

            paymentDueDate: dueDate || undefined,

            paymentNote: paymentNote || undefined,

            beneficiary: {
              name: beneficiaryName
            }
          }
        ]
      });

      const svg = await QRCode.toString(bySquareString, {
        type: "svg",
        width: 300,
        margin: 1
      });

      return json({
        payload: bySquareString,
        svg
      });

    } catch (e: any) {
      return json(
        { error: e?.message || "Server error" },
        500
      );
    }
  }
};