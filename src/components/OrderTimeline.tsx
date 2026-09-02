import clsx from "clsx";
import { Check, X, Clock } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

const STEPS: { label: string; sublabel: string }[] = [
  { label: "Placed", sublabel: "Order received" },
  { label: "Confirmed", sublabel: "Getting it ready" },
  { label: "Shipped", sublabel: "On its way" },
  { label: "Delivered", sublabel: "Enjoy!" },
];

// Only used for the alternate paths below -- a normal in-progress order
// always maps onto STEPS above.
function currentStepIndex(status: OrderStatus): number {
  switch (status) {
    case "pending_payment":
      return 0;
    case "confirmed":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

// A visual step tracker for the customer-facing order page. Cancelled and
// cancellation-requested orders don't fit the normal 4-step line -- a
// cancellation can only be requested before an order ships (see
// canRequestCancellation), so there's no "how far did it get" to show
// either way. Those two get their own banner instead of a half-filled
// progress bar that would misleadingly imply steps happened out of order.
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50/60 p-4 text-sm text-red-800">
        <X className="h-5 w-5 shrink-0" />
        <span>This order was cancelled.</span>
      </div>
    );
  }

  if (status === "cancellation_requested") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-900">
        <Clock className="h-5 w-5 shrink-0" />
        <span>Cancellation requested — we&rsquo;ll confirm shortly.</span>
      </div>
    );
  }

  const current = currentStepIndex(status);
  const isWaitingOnPayment = status === "pending_payment";

  return (
    <div>
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const done = i <= current && !(isWaitingOnPayment && i > 0);
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step.label} className={clsx("flex flex-1 flex-col items-center text-center", !isLast && "relative")}>
              {!isLast && (
                <div
                  className={clsx(
                    "absolute left-1/2 top-4 h-0.5 w-full",
                    i < current && !isWaitingOnPayment ? "bg-maroon" : "bg-line"
                  )}
                />
              )}
              <div
                className={clsx(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                  done ? "border-maroon bg-maroon text-white" : "border-line bg-white text-ink/70"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p className={clsx("mt-2 text-sm font-medium", done ? "text-ink" : "text-ink/70")}>{step.label}</p>
              <p className="text-sm text-ink/70">{step.sublabel}</p>
            </div>
          );
        })}
      </div>
      {isWaitingOnPayment && (
        <p className="mt-4 text-center text-sm text-amber-800">Waiting for payment confirmation.</p>
      )}
    </div>
  );
}
