"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { NO_RETURNS_NOTE } from "@/lib/policies";
import type { Order } from "@/lib/types";

// jsPDF's built-in fonts (Helvetica/Times/Courier) only support WinAnsi
// encoding, which doesn't include ₹ (U+20B9) -- it silently renders as a
// mangled superscript-1 glyph instead of throwing, so this is easy to miss
// without actually opening a generated PDF. Embedding a Unicode font just
// for the rupee sign isn't worth the bundle weight, so the PDF spells it
// out as "Rs." instead; the rest of the site keeps using the real ₹ symbol
// (formatINR) since browsers render it fine.
function formatRs(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

// Builds a simple one-page invoice PDF entirely in the browser (jsPDF has
// no server dependency), so there's no server route, no PDF-rendering
// service, and nothing extra to deploy -- just a button that assembles the
// document from the order data already on the page.
export function DownloadInvoiceButton({ order }: { order: Order }) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 48;
      let y = 56;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(siteConfig.name, marginX, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      y += 16;
      doc.text(siteConfig.address, marginX, y);
      y += 12;
      doc.text(`${siteConfig.phone}  |  ${siteConfig.email}`, marginX, y);

      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("INVOICE", 547, 56, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Order #${order.id}`, 547, 74, { align: "right" });
      doc.text(
        new Date(order.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        547,
        88,
        { align: "right" }
      );

      y = 130;
      doc.setDrawColor(220);
      doc.line(marginX, y, 547, y);

      y += 24;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Billed To", marginX, y);
      doc.setFont("helvetica", "normal");
      y += 16;
      doc.text(order.customerName, marginX, y);
      y += 14;
      doc.text(order.phone, marginX, y);
      y += 14;
      doc.text(order.email, marginX, y);
      y += 14;
      const addressLines = doc.splitTextToSize(
        `${order.address}, ${order.city}, ${order.state} ${order.pincode}`,
        260
      );
      doc.text(addressLines, marginX, y);
      y += addressLines.length * 14 + 10;

      doc.setFont("helvetica", "bold");
      doc.text("Payment Method", 320, 154);
      doc.setFont("helvetica", "normal");
      doc.text(order.paymentMethod === "razorpay" ? "Paid Online (Razorpay)" : "Cash on Delivery", 320, 170);

      y = Math.max(y, 200);
      doc.setDrawColor(220);
      doc.line(marginX, y, 547, y);

      // Items table
      y += 24;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Item", marginX, y);
      doc.text("Qty", 380, y, { align: "right" });
      doc.text("Price", 460, y, { align: "right" });
      doc.text("Total", 547, y, { align: "right" });
      y += 8;
      doc.setDrawColor(0);
      doc.line(marginX, y, 547, y);

      doc.setFont("helvetica", "normal");
      for (const item of order.items) {
        y += 20;
        const nameLines = doc.splitTextToSize(item.name, 300);
        doc.text(nameLines, marginX, y);
        doc.text(String(item.quantity), 380, y, { align: "right" });
        doc.text(formatRs(item.price), 460, y, { align: "right" });
        doc.text(formatRs(item.price * item.quantity), 547, y, { align: "right" });
        y += (nameLines.length - 1) * 14;
      }

      y += 12;
      doc.setDrawColor(220);
      doc.line(320, y, 547, y);

      y += 20;
      doc.text("Subtotal", 460, y, { align: "right" });
      doc.text(formatRs(order.subtotal), 547, y, { align: "right" });
      y += 16;
      doc.text("Shipping", 460, y, { align: "right" });
      doc.text(order.shipping === 0 ? "Free" : formatRs(order.shipping), 547, y, { align: "right" });
      y += 10;
      doc.setDrawColor(0);
      doc.line(400, y, 547, y);
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total", 460, y, { align: "right" });
      doc.text(formatRs(order.total), 547, y, { align: "right" });

      // Footer
      const footerY = 760;
      doc.setDrawColor(220);
      doc.line(marginX, footerY - 24, 547, footerY - 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(120);
      doc.text(NO_RETURNS_NOTE, marginX, footerY - 8);
      doc.text("Thank you for shopping with " + siteConfig.name + ".", marginX, footerY + 6);

      doc.save(`invoice-${order.id}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      className="flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-maroon hover:text-maroon disabled:opacity-60"
    >
      <FileDown className="h-4 w-4" /> {generating ? "Preparing..." : "Download Invoice"}
    </button>
  );
}
