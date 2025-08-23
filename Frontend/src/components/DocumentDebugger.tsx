import React from 'react';

interface DocumentDebuggerProps {
  loadedDocuments: any[];
  trade: any;
  documentsLoading: boolean;
  documentsError: string | null;
}

export default function DocumentDebugger({ 
  loadedDocuments, 
  trade, 
  documentsLoading, 
  documentsError 
}: DocumentDebuggerProps) {
  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
      <h3 className="text-red-400 font-semibold mb-2">🔍 Document Debug Info</h3>
      
      <div className="space-y-2 text-sm text-gray-300">
        <div>
          <strong>Loading:</strong> {documentsLoading ? 'YES' : 'NO'}
        </div>
        
        <div>
          <strong>Error:</strong> {documentsError || 'None'}
        </div>
        
        <div>
          <strong>Loaded Documents Count:</strong> {loadedDocuments?.length || 0}
        </div>
        
        <div>
          <strong>Loaded Documents:</strong>
          <pre className="bg-black/30 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(loadedDocuments, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Trade Documents:</strong>
          <pre className="bg-black/30 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
            {JSON.stringify(trade?.documents, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Trade ID:</strong> {trade?.id}
        </div>
        
        <div>
          <strong>Trade Title:</strong> {trade?.title}
        </div>
      </div>
    </div>
  );
}
