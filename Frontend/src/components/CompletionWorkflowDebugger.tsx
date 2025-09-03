import React, { useState } from 'react';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { apiCall } from '../api/api';

interface DebugResult {
  endpoint: string;
  status: 'success' | 'error' | 'testing';
  response?: any;
  error?: any;
  timestamp: string;
}

interface CompletionWorkflowDebuggerProps {
  trade: any;
  project: any;
  acceptedQuote: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletionWorkflowDebugger({ 
  trade, 
  project, 
  acceptedQuote, 
  isOpen, 
  onClose 
}: CompletionWorkflowDebuggerProps) {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: DebugResult) => {
    setResults(prev => [...prev, result]);
  };

  const testApiEndpoint = async (endpoint: string, method: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    
    addResult({
      endpoint,
      status: 'testing',
      timestamp
    });

    try {
      const response = await apiCall(endpoint, {
        method,
        body: data ? JSON.stringify(data) : undefined,
        headers: data ? { 'Content-Type': 'application/json' } : undefined
      });

      addResult({
        endpoint,
        status: 'success',
        response,
        timestamp
      });

      return { success: true, data: response };
    } catch (error: any) {
      addResult({
        endpoint,
        status: 'error',
        error: {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        },
        timestamp
      });

      return { success: false, error };
    }
  };

  const runFullTest = async () => {
    setTesting(true);
    setResults([]);

    console.log('🧪 Starte vollständigen API-Test...');

    // 1. Test Notifications API
    const notificationData = {
      type: 'completion_request',
      title: `TEST: Fertigstellungsmeldung ${trade?.title}`,
      message: 'Test-Benachrichtigung für Debugging',
      priority: 'high',
      project_id: project?.id,
      milestone_id: trade?.id
    };

    await testApiEndpoint('/notifications/', 'POST', notificationData);
    await testApiEndpoint('/notifications/', 'GET');

    // 2. Test Tasks API
    const taskData = {
      title: `TEST: Abnahme ${trade?.title}`,
      description: 'Test-Task für Debugging',
      status: 'todo',
      priority: 'high',
      project_id: project?.id,
      category: 'acceptance'
    };

    await testApiEndpoint('/tasks/', 'POST', taskData);
    await testApiEndpoint('/tasks/', 'GET');

    // 3. Test Alternative Endpunkte
    await testApiEndpoint('/tasks', 'GET'); // ohne trailing slash
    await testApiEndpoint('/notifications', 'GET'); // ohne trailing slash

    setTesting(false);
    console.log('🧪 API-Test abgeschlossen');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="text-green-400" />;
      case 'error': return <XCircle size={16} className="text-red-400" />;
      case 'testing': return <RefreshCw size={16} className="text-yellow-400 animate-spin" />;
      default: return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <Bug size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">API-Debugging</h2>
              <p className="text-gray-300">Teste Fertigstellungs-Workflow APIs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={runFullTest}
              disabled={testing}
              className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-xl font-semibold hover:bg-[#ffa726] transition-colors disabled:opacity-50"
            >
              {testing ? 'Teste...' : 'APIs testen'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={24} className="text-gray-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Debug-Daten */}
          <div className="mb-6 bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Kontext-Daten:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Trade ID:</span>
                <span className="text-white ml-2">{trade?.id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Project ID:</span>
                <span className="text-white ml-2">{project?.id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Trade Title:</span>
                <span className="text-white ml-2">{trade?.title || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Service Provider:</span>
                <span className="text-white ml-2">{acceptedQuote?.company_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Test-Ergebnisse */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">API-Test-Ergebnisse:</h3>
            
            {results.length === 0 ? (
              <div className="text-center py-8">
                <Bug size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">Klicken Sie auf "APIs testen" um zu beginnen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <span className="text-white font-medium">{result.endpoint}</span>
                      </div>
                      <span className="text-xs text-gray-400">{result.timestamp}</span>
                    </div>
                    
                    {result.status === 'success' && (
                      <div className="text-green-300 text-sm">
                        ✅ Erfolgreich - Status: {result.response?.status || 'OK'}
                      </div>
                    )}
                    
                    {result.status === 'error' && (
                      <div className="text-red-300 text-sm">
                        ❌ Fehler: {result.error?.status} - {result.error?.message}
                        {result.error?.data && (
                          <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.error.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
