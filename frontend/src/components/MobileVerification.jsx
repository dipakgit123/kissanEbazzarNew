// MobileVerification.js - Updated to work with location flow
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { otpService } from '../services/api'; // Make sure this path is correct

const MobileVerification = ({ onBack, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Get phone number from localStorage or props
  useEffect(() => {
    const storedPhone = localStorage.getItem('phoneNumber');
    if (storedPhone) {
      setPhoneNumber(storedPhone);
    }
  }, []);

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-read OTP from SMS (for browsers that support it)
  useEffect(() => {
    if ('OTPCredential' in window) {
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
  }, []);

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
      const response = await otpService.verifyOTP(phoneNumber, otpCode);
      
      if (response.success) {
        toast.success('Verification successful!');
        
        // Store token and user info
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        // Call success callback after a short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1000);
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
      const response = await otpService.resendOTP(phoneNumber);
      
      if (response.success) {
        toast.success('OTP resent successfully!');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setResendTimer(60);
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
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>
          <p className="text-gray-600">
            Enter the code sent to {phoneNumber}
          </p>
        </div>
        
        {/* OTP Input */}
        <div className="space-y-6">
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
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          
          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-full text-center text-sm text-gray-600 hover:text-[#15BB73] transition-colors"
          >
            Change phone number
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileVerification;