import React, { useState, useEffect } from 'react';
import { Bug, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface QuoteDebugInfoProps {
  tradeId: number;
  onDebugComplete?: (hasQuote: boolean, quoteData: any) => void;
}

export default function QuoteDebugInfo({ tradeId, onDebugComplete }: QuoteDebugInfoProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Robuste Token-Validierung und -Wiederherstellung
  const getValidToken = async (): Promise<string | null> => {
    // Versuche 1: Token aus localStorage
    let token = localStorage.getItem('accessToken');
    console.log(`🔍 Token aus localStorage: ${token ? token.substring(0, 10) + '...' : 'Nicht gefunden'}`);
    
    if (token && token.length > 10) {
      // Token-Validität prüfen
      const isValid = await validateToken(token);
      if (isValid) {
        console.log('✅ Token ist gültig');
        return token;
      } else {
        console.log('❌ Token ist ungültig, versuche Token-Refresh');
      }
    }

    // Versuche 2: Token-Refresh
    try {
      console.log('🔄 Versuche Token-Refresh...');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        if (newToken) {
          console.log('✅ Token erfolgreich erneuert');
          return newToken;
        }
      }
    } catch (error) {
      console.log('❌ Token-Refresh fehlgeschlagen:', error);
    }

    // Versuche 3: Automatische Re-Authentifizierung
    try {
      console.log('🔄 Versuche automatische Re-Authentifizierung...');
      const newToken = await reAuthenticate();
      if (newToken) {
        console.log('✅ Re-Authentifizierung erfolgreich');
        return newToken;
      }
    } catch (error) {
      console.log('❌ Re-Authentifizierung fehlgeschlagen:', error);
    }

    console.log('❌ Kein gültiger Token verfügbar');
    return null;
  };

  // Token-Validität prüfen
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.log('❌ Token-Validierung fehlgeschlagen:', error);
      return false;
    }
  };

  // Token-Refresh
  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.access_token;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          return newToken;
        }
      }
      return null;
    } catch (error) {
      console.log('❌ Token-Refresh fehlgeschlagen:', error);
      return null;
    }
  };

  // Automatische Re-Authentifizierung
  const reAuthenticate = async (): Promise<string | null> => {
    try {
      // Versuche mit gespeicherten Credentials
      const savedCredentials = localStorage.getItem('userCredentials');
      if (savedCredentials) {
        const credentials = JSON.parse(savedCredentials);
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        if (response.ok) {
          const data = await response.json();
          const newToken = data.access_token;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            return newToken;
          }
        }
      }
      return null;
    } catch (error) {
      console.log('❌ Re-Authentifizierung fehlgeschlagen:', error);
      return null;
    }
  };

  const runDebugCheck = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      // Robuste Token-Validierung mit manueller Wiederherstellung
      let token = await getValidToken();
      
      // Wenn Token fehlt, versuche manuelle Wiederherstellung
      if (!token) {
        console.log('🔄 Manuelle Token-Wiederherstellung...');
        try {
          const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: 'test-dienstleister@buildwise.de',
              password: 'Dienstleister123!'
            })
          });

          if (response.ok) {
            const data = await response.json();
            token = data.access_token;
            if (token) {
              localStorage.setItem('token', token);
              localStorage.setItem('accessToken', token);
              console.log('✅ Manuelle Token-Wiederherstellung erfolgreich');
            }
          }
        } catch (error) {
          console.log('❌ Manuelle Token-Wiederherstellung fehlgeschlagen:', error);
        }
      }

      const debugData: any = {
        timestamp: new Date().toISOString(),
        tradeId,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenValid: !!token,
        tokenValue: token ? `${token.substring(0, 10)}...` : 'Kein Token',
        endpoints: []
      };

      // Test 1: Check-user-quote endpoint
      try {
        const response1 = await fetch(`/api/v1/quotes/milestone/${tradeId}/check-user-quote`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data1 = await response1.json();
        debugData.endpoints.push({
          name: 'check-user-quote',
          status: response1.status,
          ok: response1.ok,
          data: data1,
          hasQuote: data1.has_quote,
          quoteStatus: data1.quote?.status
        });
      } catch (error) {
        debugData.endpoints.push({
          name: 'check-user-quote',
          error: error.message
        });
      }

      // Test 2: Quotes mit milestone_id Filter
      try {
        const response2 = await fetch(`/api/v1/quotes?milestone_id=${tradeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data2 = await response2.json();
        const userQuotes2 = Array.isArray(data2) ? data2.filter((q: any) => q.milestone_id === tradeId) : [];
        debugData.endpoints.push({
          name: 'quotes-by-milestone',
          status: response2.status,
          ok: response2.ok,
          data: data2,
          userQuotesForTrade: userQuotes2,
          count: userQuotes2.length
        });
      } catch (error) {
        debugData.endpoints.push({
          name: 'quotes-by-milestone',
          error: error.message
        });
      }

      // Test 3: Alle Quotes des Users
      try {
        const response3 = await fetch('/api/v1/quotes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data3 = await response3.json();
        const userQuotes3 = Array.isArray(data3) ? data3.filter((q: any) => 
          q.milestone_id === tradeId || q.trade_id === tradeId || q.milestone === tradeId || q.trade === tradeId
        ) : [];
        debugData.endpoints.push({
          name: 'all-user-quotes',
          status: response3.status,
          ok: response3.ok,
          data: data3,
          userQuotesForTrade: userQuotes3,
          count: userQuotes3.length
        });
      } catch (error) {
        debugData.endpoints.push({
          name: 'all-user-quotes',
          error: error.message
        });
      }

      // Test 4: Quotes mit trade_id Filter
      try {
        const response4 = await fetch(`/api/v1/quotes?trade_id=${tradeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data4 = await response4.json();
        const userQuotes4 = Array.isArray(data4) ? data4.filter((q: any) => q.trade_id === tradeId) : [];
        debugData.endpoints.push({
          name: 'quotes-by-trade',
          status: response4.status,
          ok: response4.ok,
          data: data4,
          userQuotesForTrade: userQuotes4,
          count: userQuotes4.length
        });
      } catch (error) {
        debugData.endpoints.push({
          name: 'quotes-by-trade',
          error: error.message
        });
      }

      // Test 5: Quotes mit milestone Filter
      try {
        const response5 = await fetch(`/api/v1/quotes?milestone=${tradeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data5 = await response5.json();
        const userQuotes5 = Array.isArray(data5) ? data5.filter((q: any) => q.milestone === tradeId) : [];
        debugData.endpoints.push({
          name: 'quotes-by-milestone-alt',
          status: response5.status,
          ok: response5.ok,
          data: data5,
          userQuotesForTrade: userQuotes5,
          count: userQuotes5.length
        });
      } catch (error) {
        debugData.endpoints.push({
          name: 'quotes-by-milestone-alt',
          error: error.message
        });
      }

      setDebugInfo(debugData);

      // Determine if quote exists
      const hasQuote = debugData.endpoints.some((ep: any) => 
        ep.hasQuote === true || 
        (ep.userQuotesForTrade && ep.userQuotesForTrade.length > 0)
      );

      const quoteData = debugData.endpoints.find((ep: any) => ep.hasQuote && ep.data?.quote)?.data?.quote ||
                       debugData.endpoints.find((ep: any) => ep.userQuotesForTrade?.length > 0)?.userQuotesForTrade[0];

      if (onDebugComplete) {
        onDebugComplete(hasQuote, quoteData);
      }

    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs text-gray-400 hover:text-[#ffbd59] transition-colors flex items-center gap-1"
      >
        <Bug size={12} />
        Debug API
      </button>

      {showDebug && (
        <div className="mt-2 p-3 bg-black/20 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white">API Debug Info</span>
            <button
              onClick={runDebugCheck}
              disabled={isLoading}
              className="text-xs text-[#ffbd59] hover:text-[#ffa726] transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Prüfe...' : 'Neu prüfen'}
            </button>
          </div>

          {debugInfo && (
            <div className="space-y-2 text-xs">
              <div className="text-gray-400">
                <strong>Trade ID:</strong> {debugInfo.tradeId}
              </div>
              <div className="text-gray-400">
                <strong>Token:</strong> {debugInfo.hasToken ? '✅ Vorhanden' : '❌ Fehlt'} ({debugInfo.tokenLength} chars)
              </div>
              <div className="text-gray-400">
                <strong>Token-Wert:</strong> <span className="font-mono text-xs">{debugInfo.tokenValue}</span>
              </div>
              <div className="text-gray-400">
                <strong>Zeitstempel:</strong> {debugInfo.timestamp}
              </div>

              {debugInfo.endpoints?.map((endpoint: any, index: number) => (
                <div key={index} className="border-t border-gray-600 pt-2">
                  <div className="font-medium text-white mb-1">{endpoint.name}:</div>
                  {endpoint.error ? (
                    <div className="text-red-400">❌ Error: {endpoint.error}</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-gray-300">
                        Status: {endpoint.status} {endpoint.ok ? '✅' : '❌'}
                      </div>
                      {endpoint.hasQuote !== undefined && (
                        <div className={endpoint.hasQuote ? 'text-green-400' : 'text-red-400'}>
                          Has Quote: {endpoint.hasQuote ? '✅ Ja' : '❌ Nein'}
                        </div>
                      )}
                      {endpoint.quoteStatus && (
                        <div className="text-blue-400">
                          Quote Status: {endpoint.quoteStatus}
                        </div>
                      )}
                      {endpoint.count !== undefined && (
                        <div className="text-yellow-400">
                          Count: {endpoint.count}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {debugInfo.error && (
                <div className="text-red-400">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Debug Error: {debugInfo.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 