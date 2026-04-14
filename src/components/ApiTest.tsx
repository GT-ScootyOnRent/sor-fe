import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { API_CONFIG } from '../config/api.config';
import { toast } from 'sonner';

export const ApiTest: React.FC = () => {
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const testApiConnection = async () => {
    setTestStatus('loading');
    setErrorMessage('');

    try {
      // Test a simple GET request to check backend connectivity
      const response = await fetch(`${API_CONFIG.BASE_URL}/States?page=1&size=10`, { credentials: 'include' });
      
      if (response.ok) {
        setTestStatus('success');
        toast.success('Connection successful!', {
          description: 'Backend is running properly.',
        });
      } else {
        setTestStatus('error');
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        setErrorMessage(errorMsg);
        toast.error('Connection failed', {
          description: errorMsg,
        });
      }
    } catch (error: any) {
      setTestStatus('error');
      const errorMsg = error.message || 'Network error. Is the backend running?';
      setErrorMessage(errorMsg);
      toast.error('Connection error', {
        description: errorMsg,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4">API Connection Test</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Backend URL:</p>
        <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{API_CONFIG.BASE_URL}</p>
      </div>

      <button
        onClick={testApiConnection}
        disabled={testStatus === 'loading'}
        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center mb-4"
      >
        {testStatus === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : (
          'Test Connection'
        )}
      </button>

      {testStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">Connection successful! Backend is running.</p>
        </div>
      )}

      {testStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
          <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800 font-semibold mb-1">Connection failed</p>
            <p className="text-xs text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
