import React, { useState } from 'react';
import { Upload, FileText, Calendar, Euro, CheckCircle } from 'lucide-react';
import { apiCall } from '../api/api';

interface InvoiceUploadProps {
  milestoneId: number;
  onInvoiceUploaded: () => void;
}

export default function InvoiceUpload({
  milestoneId,
  onInvoiceUploaded
}: InvoiceUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Bitte laden Sie nur PDF-Dateien hoch.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !amount || !dueDate) {
      alert('Bitte füllen Sie alle Felder aus und wählen Sie eine PDF-Datei.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('invoice_file', selectedFile);
      formData.append('amount', amount);
      formData.append('due_date', dueDate);

      await apiCall(`/milestones/${milestoneId}/invoice`, {
        method: 'POST',
        body: formData,
        headers: {} // Lasse Content-Type automatisch setzen
      });

      setIsUploaded(true);
      onInvoiceUploaded();
    } catch (error) {
      console.error('Fehler beim Hochladen der Rechnung:', error);
      alert('Fehler beim Hochladen der Rechnung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploaded) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
        <div className="text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Rechnung erfolgreich hochgeladen</h3>
          <p className="text-gray-400">Die Rechnung wurde erfolgreich beim Bauträger eingereicht.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl p-6 border border-gray-600/30">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[#ffbd59]" />
        Rechnung hochladen
      </h3>

      <div className="space-y-4">
        {/* Datei-Upload */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Rechnungs-PDF</label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="invoice-file"
              disabled={isUploading}
            />
            <label
              htmlFor="invoice-file"
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg cursor-pointer hover:bg-[#1a1a2e]/80 transition-colors"
            >
              <Upload size={20} />
              {selectedFile ? selectedFile.name : 'PDF-Datei auswählen'}
            </label>
          </div>
        </div>

        {/* Betrag */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            <Euro size={16} className="inline mr-1" />
            Rechnungsbetrag
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
            disabled={isUploading}
          />
        </div>

        {/* Fälligkeitsdatum */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            <Calendar size={16} className="inline mr-1" />
            Zahlungsfrist
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
            disabled={isUploading}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isUploading || !selectedFile || !amount || !dueDate}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1a1a2e]"></div>
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Upload size={20} />
              Rechnung einreichen
            </>
          )}
        </button>
      </div>
    </div>
  );
}