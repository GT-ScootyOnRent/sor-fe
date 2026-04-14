import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowRight, Home } from 'lucide-react';

const PaymentFailurePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const txnid = searchParams.get('txnid');
  const message = searchParams.get('error_Message') || 'Payment failed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {txnid && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Transaction ID:</p>
            <p className="font-semibold text-gray-900">{txnid}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-indigo-700 transition flex items-center justify-center"
          >
            Try Again
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
