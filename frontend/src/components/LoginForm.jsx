import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import loginImage from '../assets/images/login1.png';
import { otpService } from '../services/api';
import LanguageSwitcher from './LanguageSwitcher';

// Icons
const PhoneIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const LoginForm = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  
  // States
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default India
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  
  // Constants
  const OTP_RESEND_DELAY = 60; // seconds

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-read OTP from SMS (for browsers that support it)
  useEffect(() => {
    if ('OTPCredential' in window && step === 2) {
      const controller = new AbortController();
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: controller.signal
      }).then(otp => {
        if (otp && otp.code) {
          const otpArray = otp.code.split('');
          setOtp(otpArray);
          handleOtpVerify(otp.code);
        }
      }).catch(() => {
        // Auto-read not available or user cancelled
      });
      
      return () => controller.abort();
    }
  }, [step]);

  // Format phone number with country code
  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith(countryCode.substring(1))) {
      return `${countryCode}${cleaned}`;
    }
    return `+${cleaned}`;
  };

  // Handle phone number submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    
    if (phoneNumber.length < 10) {
      toast.error(t('auth.invalidPhone'));
      return;
    }
    
    setIsLoading(true);
    const formattedPhone = formatPhoneNumber(phoneNumber);
    setFullPhoneNumber(formattedPhone);
    
    try {
      const response = await otpService.sendOTP(formattedPhone);
      
      if (response.success) {
        toast.success(t('auth.otpSent'));
        setStep(2);
        setResendTimer(OTP_RESEND_DELAY);
      }
    } catch (error) {
      toast.error(error.message || t('auth.otpSent'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setOtpError('');
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
      
      // Auto-submit if all 6 digits are entered
      if (index === 5 && value && newOtp.every(digit => digit)) {
        handleOtpVerify(newOtp.join(''));
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(newOtp);
      if (pastedData.length === 6) {
        handleOtpVerify(pastedData);
      }
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async (otpString = null) => {
    const otpCode = otpString || otp.join('');
    
    if (otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await otpService.verifyOTP(fullPhoneNumber, otpCode);
      
      if (response.success) {
        toast.success(t('auth.loginSuccess'));
        
        // Store token and user info
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }
      }
    } catch (error) {
      setOtpError(error.message || 'Invalid OTP');
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    
    try {
      const response = await otpService.resendOTP(fullPhoneNumber);
      
      if (response.success) {
        toast.success('OTP resent successfully!');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setResendTimer(OTP_RESEND_DELAY);
        // Focus first OTP input
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] p-4">
      <Toaster position="top-right" />
      
      {/* Language Switcher - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl lg:max-w-6xl flex flex-col lg:flex-row min-h-[600px]">
        {/* Image Side - Left */}
        <div className="lg:w-[58%] relative overflow-hidden h-56 sm:h-72 lg:h-auto">
          <img 
            src={loginImage} 
            alt="Kissan E-Bazzar Login" 
            className="w-full h-full object-cover object-center lg:object-left"
          />
          
          {/* Progress Indicator */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8 flex space-x-1">
            <div className={`w-6 sm:w-8 h-1 rounded ${step >= 1 ? 'bg-[#15BB73]' : 'bg-white/40'}`}></div>
            <div className={`w-6 sm:w-8 h-1 rounded ${step >= 2 ? 'bg-[#15BB73]' : 'bg-white/40'}`}></div>
          </div>
        </div>
        
        {/* Form Side - Right */}
        <div className="lg:w-[42%] p-6 sm:p-8 lg:p-8 xl:p-10">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <div className="h-full flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.welcomeBack')}</h2>
                <p className="text-gray-600">{t('auth.loginToContinue')}</p>
              </div>
              
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.phoneNumber')}
                  </label>
                  <div className="flex space-x-2">
                    <div className="px-3 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span className="font-medium">+91</span>
                    </div>
                    
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
                        placeholder={t('auth.enterPhone')}
                        maxLength="10"
                        required
                        autoFocus
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <PhoneIcon />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('auth.otpMessage')}
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || phoneNumber.length < 10}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
                    isLoading || phoneNumber.length < 10
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? t('common.loading') : t('auth.sendOTP')}
                </button>

                {/* Info Note */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {t('auth.areYouVeterinarian')}{' '}
                    <Link
                      to="/veterinarian/login"
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      {t('auth.clickHereToLogin')}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}
          
          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="h-full flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.verifyOTP')}</h2>
                <p className="text-gray-600">
                  {t('auth.enterOTP')} {fullPhoneNumber}
                </p>
              </div>
              
              <div className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    {t('auth.enter6DigitCode')}
                  </label>
                  <div className="flex space-x-3 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 ${
                          otpError ? 'border-red-400' : digit ? 'border-[#15BB73]' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all`}
                        maxLength="1"
                        autoComplete="off"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <p className="text-red-500 text-sm mt-3 text-center">{otpError}</p>
                  )}
                </div>
                
                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-600 text-sm">
                      {t('auth.resendCodeIn')} <span className="font-semibold">{resendTimer}</span> {t('auth.seconds')}
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-[#15BB73] font-semibold text-sm hover:underline disabled:opacity-50"
                    >
                      {t('auth.resendOTP')}
                    </button>
                  )}
                </div>
                
                {/* Verify Button */}
                <button
                  onClick={() => handleOtpVerify()}
                  disabled={isLoading || otp.join('').length !== 6}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
                    isLoading || otp.join('').length !== 6
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? t('common.loading') : t('auth.verifyOTP')}
                </button>
                
                {/* Change Number */}
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                    setOtpError('');
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-[#15BB73] transition-colors"
                >
                  {t('auth.changePhoneNumber')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;