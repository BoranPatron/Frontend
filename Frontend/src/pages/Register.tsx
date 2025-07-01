import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Building,
  Globe,
  FileText,
  ArrowLeft,
  Zap
} from 'lucide-react';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'private' | 'professional' | 'service_provider';
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyWebsite: string;
  businessLicense: string;
  region: string;
  languages: string;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  privacyPolicyAccepted: boolean;
  termsAccepted: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isStrong: boolean;
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isStrong: false
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'private',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyWebsite: '',
    businessLicense: '',
    region: '',
    languages: '',
    dataProcessingConsent: false,
    marketingConsent: false,
    privacyPolicyAccepted: false,
    termsAccepted: false
  });

  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    }
  }, [formData.password]);

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;
    if (password.length >= 12) { score += 2; } else { feedback.push('Mindestens 12 Zeichen erforderlich'); }
    if (/[A-Z]/.test(password)) { score += 1; } else { feedback.push('Mindestens ein Großbuchstabe erforderlich'); }
    if (/[a-z]/.test(password)) { score += 1; } else { feedback.push('Mindestens ein Kleinbuchstabe erforderlich'); }
    if (/\d/.test(password)) { score += 1; } else { feedback.push('Mindestens eine Zahl erforderlich'); }
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) { score += 1; } else { feedback.push('Mindestens ein Sonderzeichen erforderlich'); }
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (!commonPasswords.includes(password.toLowerCase())) { score += 1; } else { feedback.push('Bitte verwenden Sie kein gängiges Passwort'); }
    return { score, feedback, isStrong: score >= 5 && password.length >= 12 };
  };

  const handleInputChange = (field: keyof RegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phone === '' || phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.email &&
          validateEmail(formData.email) &&
          formData.password &&
          passwordStrength.isStrong &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.firstName.trim() &&
          formData.lastName.trim()
        );
      case 2:
        return (
          formData.userType !== 'private' ||
          (formData.companyName.trim() && formData.companyAddress.trim())
        );
      case 3:
        return (
          formData.dataProcessingConsent &&
          formData.privacyPolicyAccepted &&
          formData.termsAccepted
        );
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!validateStep(3)) {
        setError('Bitte füllen Sie alle erforderlichen Felder aus');
        return;
      }
      const registerData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        user_type: formData.userType,
        // DSGVO-Einwilligungen
        data_processing_consent: Boolean(formData.dataProcessingConsent),
        marketing_consent: Boolean(formData.marketingConsent),
        privacy_policy_accepted: Boolean(formData.privacyPolicyAccepted),
        terms_accepted: Boolean(formData.termsAccepted),
        ...(formData.userType !== 'private' && {
          company_name: formData.companyName.trim(),
          company_address: formData.companyAddress.trim(),
          company_phone: formData.companyPhone.trim() || null,
          company_website: formData.companyWebsite.trim() || null,
          business_license: formData.businessLicense.trim() || null,
          region: formData.region.trim() || null,
          languages: formData.languages.trim() || null
        })
      };
      await api.post('/auth/register', registerData);
      setSuccess('Registrierung erfolgreich! Sie werden automatisch angemeldet...');
      setTimeout(async () => {
        try {
          const loginFormData = new URLSearchParams();
          loginFormData.append('username', formData.email);
          loginFormData.append('password', formData.password);
          const loginResponse = await api.post('/auth/login', loginFormData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          const { access_token, user } = loginResponse.data;
          login(access_token, user);
          navigate('/');
        } catch (loginError: any) {
          navigate('/login');
        }
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score >= 5) return 'text-green-400';
    if (passwordStrength.score >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPasswordStrengthWidth = () => {
    return Math.min((passwordStrength.score / 6) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d4952] to-[#2c3e50] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">BW</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">BuildWise</h2>
          <p className="text-gray-300">Erstellen Sie Ihr Konto</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-[#ffbd59] border-[#ffbd59] text-white' 
                      : 'border-gray-500 text-gray-400'
                  }`}>
                    {step < currentStep ? <CheckCircle size={20} /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      step < currentStep ? 'bg-[#ffbd59]' : 'bg-gray-500'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-300">
              {currentStep === 1 && 'Persönliche Daten'}
              {currentStep === 2 && 'Firmendaten (optional)'}
              {currentStep === 3 && 'Einwilligungen'}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vorname *</label>
                    <input type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Max" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nachname *</label>
                    <input type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Mustermann" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">E-Mail-Adresse *</label>
                  <div className="relative">
                    <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="max.mustermann@beispiel.de" required />
                    <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  {formData.email && !validateEmail(formData.email) && (<p className="text-red-400 text-sm mt-1">Bitte geben Sie eine gültige E-Mail-Adresse ein</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefonnummer (optional)</label>
                  <div className="relative">
                    <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="+49 123 456789" />
                    <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  {formData.phone && !validatePhone(formData.phone) && (<p className="text-red-400 text-sm mt-1">Bitte geben Sie eine gültige Telefonnummer ein</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Passwort *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="w-full px-4 py-3 pl-12 pr-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Mindestens 12 Zeichen" required />
                    <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                  {formData.password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Passwort-Stärke:</span>
                        <span className={getPasswordStrengthColor()}>{passwordStrength.score >= 5 ? 'Stark' : passwordStrength.score >= 3 ? 'Mittel' : 'Schwach'}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score >= 5 ? 'bg-green-500' : passwordStrength.score >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${getPasswordStrengthWidth()}%` }} />
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-gray-400 space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <XCircle size={12} className="text-red-400" />
                              {feedback}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Passwort bestätigen *</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} className="w-full px-4 py-3 pl-12 pr-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Passwort wiederholen" required />
                    <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (<p className="text-red-400 text-sm mt-1">Passwörter stimmen nicht überein</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Benutzertyp *</label>
                  <select value={formData.userType} onChange={(e) => handleInputChange('userType', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300">
                    <option value="private">Privatperson</option>
                    <option value="professional">Bauherr / Architekt</option>
                    <option value="service_provider">Dienstleister</option>
                  </select>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-6">
                {formData.userType !== 'private' && (<>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-yellow-300 mb-2"><Building size={20} /><span className="font-medium">Firmendaten</span></div>
                    <p className="text-sm text-yellow-200">Als {formData.userType === 'professional' ? 'Bauherr/Architekt' : 'Dienstleister'} benötigen wir zusätzliche Informationen über Ihr Unternehmen.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Firmenname *</label>
                      <div className="relative">
                        <input type="text" value={formData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Musterfirma GmbH" required={formData.userType !== 'private'} />
                        <Building size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Firmenwebsite (optional)</label>
                      <div className="relative">
                        <input type="url" value={formData.companyWebsite} onChange={(e) => handleInputChange('companyWebsite', e.target.value)} className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="www.musterfirma.de" />
                        <Globe size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                      {formData.companyWebsite && !validateUrl(formData.companyWebsite) && (<p className="text-red-400 text-sm mt-1">Bitte geben Sie eine gültige URL ein</p>)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Firmenadresse *</label>
                    <textarea value={formData.companyAddress} onChange={(e) => handleInputChange('companyAddress', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Musterstraße 123, 12345 Musterstadt" rows={3} required={formData.userType !== 'private'} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Firmentelefon (optional)</label>
                      <div className="relative">
                        <input type="tel" value={formData.companyPhone} onChange={(e) => handleInputChange('companyPhone', e.target.value)} className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="+49 123 456789" />
                        <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Gewerbeschein (optional)</label>
                      <input type="text" value={formData.businessLicense} onChange={(e) => handleInputChange('businessLicense', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Gewerbeschein-Nummer" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Region (optional)</label>
                      <input type="text" value={formData.region} onChange={(e) => handleInputChange('region', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="z.B. Bayern, München" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sprachen (optional)</label>
                      <input type="text" value={formData.languages} onChange={(e) => handleInputChange('languages', e.target.value)} className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300" placeholder="Deutsch, Englisch" />
                    </div>
                  </div>
                </>)}
                {formData.userType === 'private' && (<div className="text-center py-8"><div className="text-gray-400 mb-4"><User size={48} className="mx-auto mb-4" /><p>Als Privatperson sind keine Firmendaten erforderlich.</p></div></div>)}
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-300 mb-2"><Shield size={20} /><span className="font-medium">Datenschutz & Einwilligungen</span></div>
                  <p className="text-sm text-blue-200">BuildWise verarbeitet Ihre Daten DSGVO-konform. Bitte geben Sie Ihre Einwilligungen.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" id="dataProcessingConsent" checked={formData.dataProcessingConsent} onChange={(e) => handleInputChange('dataProcessingConsent', e.target.checked)} className="mt-1 w-5 h-5 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2" required />
                    <div>
                      <label htmlFor="dataProcessingConsent" className="text-sm font-medium text-white cursor-pointer">Einwilligung zur Datenverarbeitung *</label>
                      <p className="text-xs text-gray-400 mt-1">Ich stimme zu, dass BuildWise meine personenbezogenen Daten zur Bereitstellung der Plattform verarbeiten darf.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" id="marketingConsent" checked={formData.marketingConsent} onChange={(e) => handleInputChange('marketingConsent', e.target.checked)} className="mt-1 w-5 h-5 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2" />
                    <div>
                      <label htmlFor="marketingConsent" className="text-sm font-medium text-white cursor-pointer">Marketing-Einwilligung (optional)</label>
                      <p className="text-xs text-gray-400 mt-1">Ich möchte über neue Features, Angebote und Updates von BuildWise informiert werden.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" id="privacyPolicyAccepted" checked={formData.privacyPolicyAccepted} onChange={(e) => handleInputChange('privacyPolicyAccepted', e.target.checked)} className="mt-1 w-5 h-5 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2" required />
                    <div>
                      <label htmlFor="privacyPolicyAccepted" className="text-sm font-medium text-white cursor-pointer">Datenschutzerklärung gelesen und akzeptiert *</label>
                      <p className="text-xs text-gray-400 mt-1">Ich habe die <button type="button" onClick={() => setIsModalOpen(true)} className="text-[#ffbd59] hover:underline">Datenschutzerklärung</button> gelesen und akzeptiere diese.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" id="termsAccepted" checked={formData.termsAccepted} onChange={(e) => handleInputChange('termsAccepted', e.target.checked)} className="mt-1 w-5 h-5 text-[#ffbd59] bg-white/10 border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2" required />
                    <div>
                      <label htmlFor="termsAccepted" className="text-sm font-medium text-white cursor-pointer">AGB gelesen und akzeptiert *</label>
                      <p className="text-xs text-gray-400 mt-1">Ich habe die <button type="button" onClick={() => setIsModalOpen(true)} className="text-[#ffbd59] hover:underline">Allgemeinen Geschäftsbedingungen</button> gelesen und akzeptiere diese.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-300 mb-2"><CheckCircle size={20} /><span className="font-medium">Sicherheitsstandards</span></div>
                  <ul className="text-sm text-green-200 space-y-1">
                    <li>• Passwort wird verschlüsselt gespeichert</li>
                    <li>• DSGVO-konforme Datenverarbeitung</li>
                    <li>• Sichere HTTPS-Verbindung</li>
                    <li>• Audit-Logging aller Aktivitäten</li>
                    <li>• Regelmäßige Sicherheitsupdates</li>
                  </ul>
                </div>
              </div>
            )}
            {error && (<div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-center gap-2"><AlertTriangle size={20} />{error}</div>)}
            {success && (<div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-300 text-sm flex items-center gap-2"><CheckCircle size={20} />{success}</div>)}
            <div className="flex items-center justify-between pt-6">
              <button type="button" onClick={() => navigate('/login')} className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white transition-colors"><ArrowLeft size={20} />Zurück zum Login</button>
              <div className="flex gap-4">
                {currentStep > 1 && (<button type="button" onClick={prevStep} className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300">Zurück</button>)}
                {currentStep < 3 ? (<button type="button" onClick={nextStep} className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-xl hover:from-[#ffa726] hover:to-[#ffbd59] transition-all duration-300 transform hover:scale-105">Weiter</button>) : (<button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-xl hover:from-[#ffa726] hover:to-[#ffbd59] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center gap-2">{loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Registrierung läuft...</>) : (<><Zap size={20} />Konto erstellen</>)}</button>)}
              </div>
            </div>
          </form>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileText size={24} />Datenschutzerklärung & AGB</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><XCircle size={24} /></button>
            </div>
            <div className="space-y-6 text-sm text-gray-300">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Datenschutzerklärung</h4>
                <p className="mb-3">BuildWise verarbeitet Ihre personenbezogenen Daten ausschließlich für die Bereitstellung der Plattform und die Erfüllung unserer vertraglichen Verpflichtungen.</p>
                <p className="mb-3"><strong>Verantwortlicher:</strong> BuildWise GmbH<br/><strong>Kontakt:</strong> datenschutz@buildwise.de<br/><strong>Zweck:</strong> Bereitstellung der BuildWise-Plattform<br/><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO</p>
                <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Allgemeine Geschäftsbedingungen</h4>
                <p className="mb-3">Mit der Nutzung von BuildWise stimmen Sie unseren Nutzungsbedingungen zu.</p>
                <p className="mb-3"><strong>Service:</strong> BuildWise ist eine Plattform für Immobilienprojekte<br/><strong>Haftung:</strong> Nach gesetzlichen Bestimmungen<br/><strong>Kündigung:</strong> Mit 30 Tagen Frist möglich<br/><strong>Änderungen:</strong> Werden 30 Tage vorher angekündigt</p>
                <p>Vollständige AGB und Datenschutzerklärung finden Sie unter buildwise.de/rechtliches</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-[#ffbd59] text-white rounded-xl hover:bg-[#ffa726] transition-colors">Verstanden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 