import React, { useState } from 'react';
import { Mail, Send, Users, X } from 'lucide-react';

interface EmailNotificationButtonProps {
  projectId: number;
  projectName: string;
  subject?: string;
  recipients?: string[];
  onSent?: () => void;
}

export default function EmailNotificationButton({ 
  projectId, 
  projectName, 
  subject, 
  recipients = [],
  onSent 
}: EmailNotificationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipients: recipients.join(', '),
    subject: subject || `Update zu Projekt: ${projectName}`,
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const response = await fetch('/api/v1/calendar/send-project-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          project_id: projectId,
          recipients: emailForm.recipients.split(',').map(email => email.trim()).filter(email => email),
          subject: emailForm.subject,
          content: emailForm.message,
          provider: 'gmail' // oder 'outlook' basierend auf User-Präferenz
        })
      });

      if (response.ok) {
        setShowModal(false);
        onSent?.();
      } else {
        console.error('❌ Fehler beim Versenden der E-Mail');
      }
    } catch (error) {
      console.error('❌ Netzwerk-Fehler:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        title="E-Mail-Benachrichtigung senden"
      >
        <Mail size={16} />
        E-Mail
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">E-Mail-Benachrichtigung</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empfänger (durch Komma getrennt)
                  </label>
                  <input
                    type="text"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachricht
                  </label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                    rows={5}
                    placeholder="Geben Sie hier Ihre Nachricht ein..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || !emailForm.recipients.trim() || !emailForm.message.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Senden...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Senden
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
