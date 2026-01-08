import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import farmerImage from '../assets/images/6101100.jpg';
import { otpService } from '../services/api';

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
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    const formattedPhone = formatPhoneNumber(phoneNumber);
    setFullPhoneNumber(formattedPhone);
    
    try {
      const response = await otpService.sendOTP(formattedPhone);
      
      if (response.success) {
        toast.success('OTP sent successfully!');
        setStep(2);
        setResendTimer(OTP_RESEND_DELAY);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
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
        toast.success('Login successful!');
        
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
      
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col lg:flex-row">
        {/* Image Side */}
        <div className="lg:w-1/2 relative overflow-hidden h-64 lg:h-auto bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/20">
          <img 
            src={farmerImage} 
            alt="Kissan E-Bazzar" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          
          {/* Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Kissan E-Bazzar</h1>
            <p className="text-sm opacity-90">
              Connecting farmers directly to consumers
            </p>
            <div className="mt-4 flex space-x-1">
              <div className={`w-8 h-1 rounded ${step >= 1 ? 'bg-[#15BB73]' : 'bg-white/40'}`}></div>
              <div className={`w-8 h-1 rounded ${step >= 2 ? 'bg-[#15BB73]' : 'bg-white/40'}`}></div>
            </div>
          </div>
        </div>
        
        {/* Form Side */}
        <div className="lg:w-1/2 p-8 lg:p-12">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <div className="h-full flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Login with your phone number</p>
              </div>
              
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] bg-gray-50"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                    
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73] transition-all"
                        placeholder="Enter phone number"
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
                    We'll send you a one-time password
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
                  {isLoading ? 'Sending...' : 'Get OTP'}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Veterinarian Links */}
                <div className="space-y-3">
                  <Link
                    to="/veterinarian/register"
                    className="w-full flex items-center justify-center py-3 px-4 border-2 border-[#15BB73] text-[#15BB73] rounded-lg font-semibold hover:bg-[#15BB73] hover:text-white transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register as Veterinarian
                  </Link>

                  <Link
                    to="/veterinarian/login"
                    className="w-full flex items-center justify-center py-3 px-4 border-2 border-blue-500 text-blue-500 rounded-lg font-semibold hover:bg-blue-500 hover:text-white transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Veterinarian Login
                  </Link>
                </div>
              </form>
            </div>
          )}
          
          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="h-full flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
                <p className="text-gray-600">
                  Enter the code sent to {fullPhoneNumber}
                </p>
              </div>
              
              <div className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Enter 6-digit code
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
                      Resend code in <span className="font-semibold">{resendTimer}</span> seconds
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-[#15BB73] font-semibold text-sm hover:underline disabled:opacity-50"
                    >
                      Resend OTP
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
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
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
                  Change phone number
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