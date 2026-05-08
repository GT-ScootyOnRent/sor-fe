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
  }
}

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
  }, [isOpen]);

  const verifyPayment = async (txnid: string, easepayid: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASEURL}/Payments/verify`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ txnid, easepayid, bookingId }),
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


  const initiatePayment = async () => {
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
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ bookingId, amount }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const checkout = new window.EasebuzzCheckout(
        import.meta.env.VITE_EASEBUZZ_KEY,
        import.meta.env.VITE_EASEBUZZ_ENV || "test"
      );

      checkout.initiatePayment({
        access_key: data.accessKey,
        onResponse: (r: any) => {
          if (r.status === "success") {
            verifyPayment(r.txnid, r.easepayid);
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
