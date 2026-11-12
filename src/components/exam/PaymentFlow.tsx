"use client";

/**
 * src/components/exam/PaymentFlow.tsx
 *
 * Mobile-wallet payment form for Bangladeshi candidates. Mirrors the
 * manual / intent payment flow used by the IELTS-Mock reference repo:
 *
 *   1. Candidate picks one of four wallets (bKash, Nagad, Rocket, Upay).
 *   2. The form shows the merchant wallet number to send money to.
 *   3. Candidate sends the amount via Send Money / Payment, then enters:
 *        - Sender number (their own wallet number)
 *        - Transaction ID (the 10-char code from the wallet SMS / app)
 *   4. Submit -> POST /api/payment/wallet creates a PENDING Payment row.
 *
 * No money is moved by this app: the candidate pays via the wallet app, then
 * reports the transaction id back. A staff member verifies the transaction
 * id against the wallet provider's merchant panel and flips the row to
 * COMPLETED (which the existing quota logic reads as paid attempts).
 *
 * Posture is consistent with the existing /api/payment route note: there is
 * no verified provider webhook in this deployment, so the row is created as
 * PENDING only and grants zero attempts until manual verification.
 */

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type WalletType = "BKASH" | "NAGAD" | "ROCKET" | "UPAY";

type WalletDef = {
  type: WalletType;
  label: string;
  number: string;
  /** Tailwind hex colour used for the logo chip + accent. */
  color: string;
  /** Short subtitle shown under the label. */
  hint: string;
};

const WALLETS: WalletDef[] = [
  {
    type: "BKASH",
    label: "bKash",
    number: "017XX-XXXXXX",
    color: "#E2136E",
    hint: "Send Money → Payment",
  },
  {
    type: "NAGAD",
    label: "Nagad",
    number: "018XX-XXXXXX",
    color: "#EC1C24",
    hint: "Send Money → Payment",
  },
  {
    type: "ROCKET",
    label: "Rocket (DBBL)",
    number: "016XX-XXXXXX-1",
    color: "#8B2C8B",
    hint: "Send Money → Payment",
  },
  {
    type: "UPAY",
    label: "Upay",
    number: "01XX-XXXXXX",
    color: "#E67E22",
    hint: "Send Money → Payment",
  },
];

type PaymentFlowProps = {
  /** Course the candidate is paying for (sent to the API as `courseId`). */
  courseId?: string;
  /** Optional amount in BDT. If omitted the candidate is told to ask staff. */
  amountBDT?: number;
  /** Called on successful submission with the created payment record id. */
  onSuccess?: (paymentId: string) => void;
  /** Optional className for the root card. */
  className?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; paymentId: string }
  | { status: "error"; message: string };

export function PaymentFlow({
  courseId,
  amountBDT,
  onSuccess,
  className,
}: PaymentFlowProps) {
  const [selected, setSelected] = useState<WalletType>("BKASH");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [touched, setTouched] = useState<{ sender?: boolean; txn?: boolean }>({});
  const [copied, setCopied] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  const wallet = useMemo(
    () => WALLETS.find((w) => w.type === selected) ?? WALLETS[0],
    [selected],
  );

  // ─── Validation ──────────────────────────────────────────────────────────
  // Sender number: BD mobile number, 11 digits starting with 01, or with a
  // leading +8801. We strip spaces and dashes before validating.
  const normalizeNumber = (s: string) => s.replace(/[\s-]/g, "");
  const senderValid = useMemo(() => {
    const n = normalizeNumber(senderNumber);
    return /^(?:\+?8801|01)\d{9}$/.test(n);
  }, [senderNumber]);

  // Transaction ID: most wallets issue a 10-char alphanumeric. We accept
  // 6–16 alphanumerics (case-insensitive) so all four providers match.
  const txnValid = useMemo(() => {
    const t = transactionId.trim();
    return /^[A-Za-z0-9]{6,16}$/.test(t);
  }, [transactionId]);

  const formValid = senderValid && txnValid && Boolean(courseId);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(wallet.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the candidate can still read the number.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ sender: true, txn: true });
    if (!formValid) return;
    setSubmit({ status: "submitting" });
    try {
      const res = await fetch("/api/payment/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletType: wallet.type,
          transactionId: transactionId.trim(),
          senderNumber: normalizeNumber(senderNumber),
          courseId,
        }),
      });
      const payload = (await res.json()) as
        | { success: true; data: { id: string; status: string } }
        | { success: false; message: string };
      if (!res.ok || !payload.success) {
        setSubmit({
          status: "error",
          message:
            (payload as { success: false; message: string }).message ??
            "Payment could not be recorded. Please try again.",
        });
        return;
      }
      setSubmit({
        status: "success",
        paymentId: payload.data.id,
      });
      onSuccess?.(payload.data.id);
    } catch {
      setSubmit({
        status: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  };

  const reset = () => {
    setSenderNumber("");
    setTransactionId("");
    setTouched({});
    setSubmit({ status: "idle" });
  };

  // ─── Success screen ─────────────────────────────────────────────────────
  if (submit.status === "success") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Payment recorded</h2>
          <p className="max-w-md text-sm leading-6 text-slate-600">
            Your transaction has been logged with reference{" "}
            <span className="font-mono font-semibold text-[#0B1F3A]">
              {submit.paymentId.slice(-8).toUpperCase()}
            </span>
            . Status: <span className="font-semibold">PENDING</span>. Once a
            staff member verifies it against the wallet provider, your attempt
            credit will be added.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reset}
            className="mt-2"
          >
            Record another payment
          </Button>
        </div>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
      noValidate
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EEF6FF] text-[#0057B8]">
          <Wallet className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-[#0B1F3A]">Pay via mobile wallet</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Send the fee from your wallet app to the merchant number, then enter
            the transaction id below. Manual verification by staff is required
            before your attempt credit is added.
          </p>
        </div>
      </div>

      {/* Wallet picker */}
      <fieldset className="mt-5">
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Choose wallet
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WALLETS.map((w) => {
            const isSelected = w.type === selected;
            return (
              <button
                key={w.type}
                type="button"
                onClick={() => {
                  setSelected(w.type);
                  // Clear any stale "copied" indicator from the previously
                  // selected wallet — done here in the click handler rather
                  // than a useEffect so we don't trigger cascading renders.
                  setCopied(false);
                }}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2",
                  isSelected
                    ? "border-transparent bg-white shadow-sm ring-2"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
                style={isSelected ? ({ ["--tw-ring-color" as string]: w.color } as React.CSSProperties) : undefined}
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: w.color }}
                >
                  <Smartphone className="size-3" aria-hidden="true" />
                  {w.label}
                </span>
                <span className="mt-1 font-mono text-xs text-slate-700">{w.number}</span>
                <span className="text-[10px] font-medium text-slate-400">{w.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Merchant number + amount */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Send to merchant ({wallet.label})
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-[#0B1F3A]">
              {wallet.number}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Amount:{" "}
              {amountBDT ? (
                <span className="font-semibold text-[#0B1F3A]">৳ {amountBDT.toLocaleString()} BDT</span>
              ) : (
                <span>confirm with staff</span>
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyNumber}
            className="shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-4 text-[#16A34A]" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden="true" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sender number + transaction id */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="wallet-sender" className="text-xs font-semibold text-slate-700">
            Your wallet number <span aria-hidden="true" className="text-[#DC2626]">*</span>
          </Label>
          <Input
            id="wallet-sender"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, sender: true }))}
            aria-invalid={touched.sender && !senderValid}
            aria-describedby="wallet-sender-help"
            className="mt-1.5"
          />
          {touched.sender && !senderValid ? (
            <p id="wallet-sender-help" className="mt-1 text-xs text-[#DC2626]">
              Enter a valid 11-digit BD mobile number (e.g. 017XXXXXXXX).
            </p>
          ) : (
            <p id="wallet-sender-help" className="mt-1 text-xs text-slate-400">
              The number you sent the payment from.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="wallet-txn" className="text-xs font-semibold text-slate-700">
            Transaction ID <span aria-hidden="true" className="text-[#DC2626]">*</span>
          </Label>
          <Input
            id="wallet-txn"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="e.g. 8N7K4P2X9Q"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, txn: true }))}
            aria-invalid={touched.txn && !txnValid}
            aria-describedby="wallet-txn-help"
            className="mt-1.5 font-mono uppercase"
          />
          {touched.txn && !txnValid ? (
            <p id="wallet-txn-help" className="mt-1 text-xs text-[#DC2626]">
              Enter the 6–16 character transaction id from the wallet SMS or app.
            </p>
          ) : (
            <p id="wallet-txn-help" className="mt-1 text-xs text-slate-400">
              The transaction id from your wallet app or confirmation SMS.
            </p>
          )}
        </div>
      </div>

      {/* Disclosure + error */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p>
          No payment is processed online. Your wallet transaction is verified
          manually by staff before your attempt credit is added. Do not close
          this window until you see the confirmation.
        </p>
      </div>

      {submit.status === "error" ? (
        <p className="mt-3 text-sm font-medium text-[#DC2626]">{submit.message}</p>
      ) : null}

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={submit.status === "submitting"}
        >
          Clear
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!formValid || submit.status === "submitting"}
          className="bg-[#0057B8] px-4 text-white hover:bg-[#0B63CE]"
        >
          {submit.status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            "Submit payment"
          )}
        </Button>
      </div>
    </form>
  );
}

export default PaymentFlow;
