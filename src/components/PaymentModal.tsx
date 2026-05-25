import React, { useEffect, useState } from "react";
import { X, CreditCard, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingId: number;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}

declare global {
  interface Window {
    EasebuzzCheckout: any;
    Razorpay: any;
  }
}

const PAYMENT_GATEWAY = import.meta.env.VITE_PAYMENT_GATEWAY || "razorpay";

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  bookingId,
  onSuccess,
  onFailure,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (PAYMENT_GATEWAY === "easebuzz") {
      // Load EaseBuzz SDK
      if (!document.getElementById("easebuzz-checkout")) {
        const script = document.createElement("script");
        script.id = "easebuzz-checkout";
        script.src =
          "https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/easebuzz-checkout.js";
        script.onload = () => setSdkReady(true);
        document.body.appendChild(script);
      } else {
        setSdkReady(true);
      }
    } else {
      // Load Razorpay SDK
      if (!document.getElementById("razorpay-checkout")) {
        const script = document.createElement("script");
        script.id = "razorpay-checkout";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => setSdkReady(true);
        document.body.appendChild(script);
      } else {
        setSdkReady(true);
      }
    }
  }, [isOpen]);

  // ─── Razorpay Payment Flow ───────────────────────────────────────────
  const verifyRazorpayPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASEURL}/Payments/verify`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            bookingId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            gateway: "razorpay",
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.success) onSuccess();
      else throw new Error(data.message);
    } catch (err: any) {
      onFailure(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateRazorpayPayment = async () => {
    if (!sdkReady) return;
    setIsProcessing(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASEURL}/Payments/initiate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ bookingId, amount, gateway: "razorpay" }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount, // in paise
        currency: "INR",
        name: "ScootyOnRent",
        description: `Booking #${bookingId}`,
        order_id: data.orderId,
        handler: function (response: any) {
          verifyRazorpayPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: localStorage.getItem("userName") || "",
          contact: localStorage.getItem("userPhone") || "",
          email: localStorage.getItem("userEmail") || "",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        onFailure(response.error.description || "Payment failed");
      });
      razorpay.open();
    } catch (err: any) {
      setIsProcessing(false);
      onFailure(err.message);
    }
  };

  // ─── EaseBuzz Payment Flow ───────────────────────────────────────────
  const verifyEasebuzzPayment = async (txnid: string, easepayid: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASEURL}/Payments/verify`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ txnid, easepayid, bookingId, gateway: "easebuzz" }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.success) onSuccess();
      else throw new Error(data.message);
    } catch (err: any) {
      onFailure(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateEasebuzzPayment = async () => {
    if (!sdkReady) return;
    setIsProcessing(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASEURL}/Payments/initiate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ bookingId, amount, gateway: "easebuzz" }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const checkout = new window.EasebuzzCheckout(
        import.meta.env.VITE_EASEBUZZ_KEY,
        import.meta.env.VITE_EASEBUZZ_ENV || "test"
      );

      checkout.initiatePayment({
        access_key: data.accessKey,
        onResponse: (r: any) => {
          if (r.status === "success") {
            verifyEasebuzzPayment(r.txnid, r.easepayid);
          } else {
            setIsProcessing(false);
            onFailure("Payment failed");
          }
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      onFailure(err.message);
    }
  };

  // ─── Main Handler ────────────────────────────────────────────────────
  const initiatePayment = () => {
    if (PAYMENT_GATEWAY === "easebuzz") {
      initiateEasebuzzPayment();
    } else {
      initiateRazorpayPayment();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Complete Payment</h3>
          <button onClick={onClose} disabled={isProcessing} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-2xl font-bold mb-4">₹{amount.toFixed(2)}</p>

        <Button
          onClick={initiatePayment}
          disabled={isProcessing || !sdkReady}
          className="w-full border border-black"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentModal;
