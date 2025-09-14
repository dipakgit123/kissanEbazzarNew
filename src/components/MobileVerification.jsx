import { useState, useEffect } from 'react';
import passwordImage from '../assets/images/My password-amico.png';

const MobileVerification = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState('mobile'); // 'mobile' or 'otp'
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digits
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [isResendActive, setIsResendActive] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Validation patterns
  const mobilePattern = /^[0-9]{10}$/;
  
  // Handle mobile input change with validation
  const handleMobileChange = (e) => {
    const value = e.target.value;
    
    // Only allow digits
    if (value === '' || /^[0-9]+$/.test(value)) {
      setMobileNumber(value);
      
      // Clear error if input is valid or empty
      if (error && (value === '' || mobilePattern.test(value))) {
        setError('');
      }
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value === '' || /^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input if a digit was entered
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle key down in OTP inputs for backspace navigation
  const handleOtpKeyDown = (index, e) => {
    // If backspace is pressed and current field is empty, focus previous field
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Start timer for OTP resend
  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && step === 'otp') {
      setIsResendActive(true);
    }
    
    return () => clearInterval(interval);
  }, [timer, step]);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    
    // Validate mobile number
    if (!mobilePattern.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    // Clear error and move to OTP step
    setError('');
    setStep('otp');
    
    // Reset OTP fields
    setOtp(['', '', '', '', '', '']);
    
    // Set timer for 2 minutes (120 seconds)
    setTimer(120);
    setIsResendActive(false);
    
    // In a real app, you would send an OTP to the mobile number here
    console.log(`Sending OTP to ${mobileNumber}`);
    
    // Focus first OTP input after a short delay
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0');
      if (firstInput) firstInput.focus();
    }, 100);
  };

  const handleResendOtp = () => {
    if (isResendActive) {
      // Reset timer
      setTimer(120);
      setIsResendActive(false);
      
      // Reset OTP fields
      setOtp(['', '', '', '', '', '']);
      
      // In a real app, you would resend an OTP to the mobile number here
      console.log(`Resending OTP to ${mobileNumber}`);
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    
    // Combine OTP digits and validate
    const otpValue = otp.join('');
    
    // Check if OTP is complete (6 digits)
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }
    
    // Clear error and process verification
    setError('');
    
    // In a real app, you would verify the OTP here
    console.log(`Verifying OTP: ${otpValue}`);
    
    // Simulate successful verification
    setVerificationSuccess(true);

    // Inform parent component after small delay
    setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E9F0F8] p-4 md:p-0">
      <div className="bg-[#FEFEFE] rounded-2xl shadow-xl overflow-hidden w-full max-w-6xl flex flex-col md:flex-row">
        {/* Image Side */}
        <div className="md:w-1/2 relative overflow-hidden h-full">
          <img 
            src={passwordImage} 
            alt="Mobile Verification" 
            className="w-full h-full object-cover object-center" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000600] via-[#000600]/50 to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
            <h2 className="text-3xl font-bold mb-2">Kissan E-Bazzar</h2>
            <p className="text-lg">Verify your mobile number to continue</p>
          </div>
        </div>
        
        {/* Form Side */}
        <div className="p-8 md:p-10 md:w-1/2">
          <div className="mb-8">
            <div className="h-1 w-20 bg-[#15BB73] mb-6"></div>
            <h2 className="text-3xl font-bold text-[#000600]">
              {step === 'mobile' ? 'Mobile Verification' : 'OTP Verification'}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === 'mobile' 
                ? 'Please enter your mobile number to receive an OTP' 
                : `We've sent a verification code to +91 ${mobileNumber}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {verificationSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              Verification successful! Redirecting...
            </div>
          )}

          {step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit} className="space-y-6">
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-bold text-[#000600] mb-1">
                  Mobile Number
                </label>
                <div className="flex">
                  <div className="bg-gray-100 flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <input
                    type="tel"
                    id="mobileNumber"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73] bg-gray-50 transition-all duration-200 focus:bg-white"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Example: 9876543210</p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-[#15BB73] hover:underline"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="bg-[#15BB73] text-white px-6 py-3 rounded-lg hover:bg-[#15BB73]/90 transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden"
                >
                  <span className="relative z-10">Send OTP</span>
                  <span className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-200"></span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp-0" className="block text-sm font-bold text-[#000600] mb-1">
                  Enter 6-digit OTP
                </label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      id={`otp-${index}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73] bg-gray-50 transition-all duration-200 focus:bg-white"
                      maxLength="1"
                      required
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {timer > 0 ? (
                      <>Resend OTP in <span className="font-medium">{formatTime(timer)}</span></>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        className={`text-[#15BB73] ${isResendActive ? 'hover:underline' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!isResendActive}
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  className="text-[#15BB73] hover:underline"
                >
                  Change Number
                </button>
                <button
                  type="submit"
                  className="bg-[#15BB73] text-white px-6 py-3 rounded-lg hover:bg-[#15BB73]/90 transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden"
                  disabled={verificationSuccess}
                >
                  <span className="relative z-10">Verify OTP</span>
                  <span className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-200"></span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileVerification;
