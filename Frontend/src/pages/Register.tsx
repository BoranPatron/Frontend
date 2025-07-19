import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Building, 
  Briefcase,
  Shield,
  FileText,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard
} from 'lucide-react';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'private' | 'professional' | 'service_provider';
  subscription_plan: 'basis' | 'pro';
  
  // DSGVO-Einwilligungen
  data_processing_consent: boolean;
  privacy_policy_accepted: boolean;
  terms_accepted: boolean;
  marketing_consent: boolean;
  
  // Dienstleister-spezifische Felder
  company_name: string;
  company_address: string;
  company_phone: string;
  company_website: string;
  business_license: string;
  tax_id: string;
  vat_id: string;
  
  // Profilinformationen
  bio: string;
  region: string;
  languages: string;
}

export default function Register() {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'private',
    subscription_plan: 'basis',
    data_processing_consent: false,
    privacy_policy_accepted: false,
    terms_accepted: false,
    marketing_consent: false,
    company_name: '',
    company_address: '',
    company_phone: '',
    company_website: '',
    business_license: '',
    tax_id: '',
    vat_id: '',
    bio: '',
    region: '',
    languages: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { isInitialized } = useAuth();
  const navigate = useNavigate();

  // Warte auf AuthContext-Initialisierung
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Initialisiere Anwendung...</p>
        </div>
      </div>
    );
  }

  // Passwort-Stärke berechnen
  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength <= 2) return 'Schwach';
    if (strength <= 3) return 'Mittel';
    if (strength <= 4) return 'Gut';
    return 'Sehr gut';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.email && formData.password && formData.confirmPassword && 
               formData.first_name && formData.last_name && 
               formData.password === formData.confirmPassword &&
               passwordStrength >= 3;
      case 2:
        return formData.user_type && formData.subscription_plan;
      case 3:
        if (formData.user_type === 'service_provider') {
          return formData.company_name && formData.company_address;
        }
        return true;
      case 4:
        return formData.data_processing_consent && formData.privacy_policy_accepted && formData.terms_accepted;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validiere alle Schritte
      if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
        throw new Error('Bitte füllen Sie alle erforderlichen Felder aus');
      }

      // Validiere User-Type und Subscription-Kombination
      if (formData.user_type === 'service_provider' && formData.subscription_plan === 'pro') {
        throw new Error('Dienstleister können nur das Basis-Modell wählen');
      }

      const response = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          user_type: formData.user_type,
          subscription_plan: formData.subscription_plan,
          data_processing_consent: formData.data_processing_consent,
          privacy_policy_accepted: formData.privacy_policy_accepted,
          terms_accepted: formData.terms_accepted,
          marketing_consent: formData.marketing_consent,
          company_name: formData.company_name || undefined,
          company_address: formData.company_address || undefined,
          company_phone: formData.company_phone || undefined,
          company_website: formData.company_website || undefined,
          business_license: formData.business_license || undefined,
          tax_id: formData.tax_id || undefined,
          vat_id: formData.vat_id || undefined,
          bio: formData.bio || undefined,
          region: formData.region || undefined,
          languages: formData.languages || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registrierung fehlgeschlagen');
      }

      setSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.');
      
      // Weiterleitung nach 3 Sekunden
      setTimeout(() => {
        navigate('/login?message=registration_success');
      }, 3000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#ffbd59] mb-6">Persönliche Informationen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vorname *
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
            placeholder="Ihr Vorname"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nachname *
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
            placeholder="Ihr Nachname"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          E-Mail-Adresse *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
          placeholder="ihre.email@beispiel.de"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Telefonnummer
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
          placeholder="+49 123 456789"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Passwort *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300 pr-12"
            placeholder="Ihr Passwort"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        {/* Passwort-Stärke */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400">{getPasswordStrengthText(passwordStrength)}</span>
            </div>
            <p className="text-xs text-gray-400">
              Mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Passwort bestätigen *
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300 pr-12 ${
              formData.confirmPassword && formData.password !== formData.confirmPassword 
                ? 'border-red-500' 
                : 'border-white/20'
            }`}
            placeholder="Passwort wiederholen"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">Passwörter stimmen nicht überein</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#ffbd59] mb-6">Account-Typ & Subscription</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Ich bin ein... *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              formData.user_type === 'private' 
                ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'private' }))}
          >
            <User className="w-8 h-8 text-[#ffbd59] mb-2" />
            <h3 className="font-semibold text-white mb-1">Privater Bauherr</h3>
            <p className="text-sm text-gray-400">Ich plane ein privates Bauprojekt</p>
          </div>
          
          <div 
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              formData.user_type === 'professional' 
                ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'professional' }))}
          >
            <Building className="w-8 h-8 text-[#ffbd59] mb-2" />
            <h3 className="font-semibold text-white mb-1">Professioneller Bauträger</h3>
            <p className="text-sm text-gray-400">Ich bin ein professioneller Bauträger</p>
          </div>
          
          <div 
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              formData.user_type === 'service_provider' 
                ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'service_provider' }))}
          >
            <Briefcase className="w-8 h-8 text-[#ffbd59] mb-2" />
            <h3 className="font-semibold text-white mb-1">Dienstleister</h3>
            <p className="text-sm text-gray-400">Ich biete Bauleistungen an</p>
          </div>
        </div>
      </div>

      {formData.user_type !== 'service_provider' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Subscription-Modell *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                formData.subscription_plan === 'basis' 
                  ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, subscription_plan: 'basis' }))}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Basis</h3>
                <span className="text-[#ffbd59] font-bold">Kostenlos</span>
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Gewerke anzeigen</li>
                <li>• Dokumente verwalten</li>
                <li>• Visualisierung</li>
              </ul>
            </div>
            
            <div 
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                formData.subscription_plan === 'pro' 
                  ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, subscription_plan: 'pro' }))}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Pro</h3>
                <span className="text-[#ffbd59] font-bold">€29/Monat</span>
              </div>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Alle Basis-Features</li>
                <li>• Projekt-Management</li>
                <li>• Analytics & Reporting</li>
                <li>• Erweiterte Tools</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#ffbd59] mb-6">
        {formData.user_type === 'service_provider' ? 'Firmeninformationen' : 'Profilinformationen'}
      </h2>
      
      {formData.user_type === 'service_provider' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Firmenname *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
              placeholder="Ihre Firma GmbH"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Firmenadresse *
            </label>
            <textarea
              name="company_address"
              value={formData.company_address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
              placeholder="Straße, PLZ Ort"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Firmen-Telefon
              </label>
              <input
                type="tel"
                name="company_phone"
                value={formData.company_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="+49 123 456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="company_website"
                value={formData.company_website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="https://www.ihre-firma.de"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gewerbeschein
              </label>
              <input
                type="text"
                name="business_license"
                value={formData.business_license}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="Gewerbeschein-Nummer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Steuernummer
              </label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="123/456/78901"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                USt-ID
              </label>
              <input
                type="text"
                name="vat_id"
                value={formData.vat_id}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="DE123456789"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Über mich
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
              placeholder="Kurze Beschreibung über sich oder Ihr Projekt..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Region
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="z.B. Bayern, Hessen..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sprachen
              </label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300"
                placeholder="z.B. Deutsch, Englisch"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#ffbd59] mb-6">Datenschutz & Einwilligungen</h2>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="checkbox"
            name="data_processing_consent"
            checked={formData.data_processing_consent}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
            required
          />
          <div>
            <label className="text-white font-medium">Datenverarbeitung *</label>
            <p className="text-sm text-gray-400 mt-1">
              Ich stimme der Verarbeitung meiner personenbezogenen Daten zur Bereitstellung der BuildWise-Dienste zu.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="checkbox"
            name="privacy_policy_accepted"
            checked={formData.privacy_policy_accepted}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
            required
          />
          <div>
            <label className="text-white font-medium">Datenschutzerklärung *</label>
            <p className="text-sm text-gray-400 mt-1">
              Ich habe die <a href="/privacy" className="text-[#ffbd59] hover:underline">Datenschutzerklärung</a> gelesen und akzeptiere diese.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="checkbox"
            name="terms_accepted"
            checked={formData.terms_accepted}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
            required
          />
          <div>
            <label className="text-white font-medium">AGB *</label>
            <p className="text-sm text-gray-400 mt-1">
              Ich akzeptiere die <a href="/terms" className="text-[#ffbd59] hover:underline">Allgemeinen Geschäftsbedingungen</a>.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="checkbox"
            name="marketing_consent"
            checked={formData.marketing_consent}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2"
          />
          <div>
            <label className="text-white font-medium">Marketing-Einwilligung (Optional)</label>
            <p className="text-sm text-gray-400 mt-1">
              Ich möchte über neue Features, Angebote und Updates per E-Mail informiert werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step <= currentStep 
                ? 'bg-[#ffbd59] text-black' 
                : 'bg-white/20 text-gray-400'
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div 
              className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-[#ffbd59]' : 'bg-white/20'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-4xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/src/logo_trans_big.png" 
              alt="BuildWise Logo" 
              className="h-32 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#ffbd59] mb-2">BuildWise</h1>
          <p className="text-gray-300">Registrierung für Ihr Konto</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 flex items-center gap-3 mb-6 rounded-xl">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 flex items-center gap-3 mb-6 rounded-xl">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Step Indicator */}
        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!validateStep(currentStep)}
                className="px-6 py-3 bg-[#ffbd59] text-black font-bold rounded-xl hover:bg-[#ffa726] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !validateStep(4)}
                className="px-6 py-3 bg-[#ffbd59] text-black font-bold rounded-xl hover:bg-[#ffa726] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrierung...' : 'Registrierung abschließen'}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Bereits ein Konto?{' '}
            <Link to="/login" className="text-[#ffbd59] hover:underline">
              Hier anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 