import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosPublic } from '../api/axiosInstance';
import Modal from '../Components/Modal';
import useAuth from '../Context/AuthContext';

function OTPVerification() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for the 4 digits
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Refs to handle auto-focus between inputs
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Redirect if already logged in (matching your logic)
  useEffect(() => {
    if (auth?.user?.role === 'hr') navigate('/manager_dashboard');
    else if (auth?.user?.role === 'Manager') navigate('/hr_dashboard');
    else if (auth?.user?.role === 'Payroll') navigate('/payroll');
  }, [auth, navigate]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Only take the last character
    setOtp(newOtp);
    setIsError(false); // Reset error when user types

    // Move to next input if value is entered
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleResend = async () => {
    try {
        const email = location.state?.email;
        if (!email) {
            alert("Email missing. Restart flow.");
            return;
        }
        await axiosPublic.post('/users/request-reset/', { email });
        alert("New OTP sent!");
        setOtp(['', '', '', '']); // Clear input
        setIsError(false);
    } catch (err) {
        console.error(err);
        alert("Failed to resend OTP.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    
    if (fullOtp.length < 4) {
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
        const email = location.state?.email;
        if (!email) {
            alert("Email not found. Please restart.");
            navigate('/Forgot_Password');
            return;
        }

        await axiosPublic.post('/users/verify-otp/', { email, otp: fullOtp });
        
        navigate('/UpdatePassword', { state: { email, otp: fullOtp } });
    } catch (err) {
        console.error(err);
        setIsError(true);
    } finally {
        setLoading(false);
    }
  };

  const handleWrongEmail = () => {
    navigate('/Forgot_Password'); // Or wherever your forget password route is
  };

  return (
    <div className="h-screen w-screen dark:bg-slate-900 bg-[url('/pic/F26.png')] bg-cover ">
      
      {/* Loading Modal */}
      <Modal isOpen={loading} location={'center'}>
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200"></div>
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin"></div>
          </div>
        </div>
      </Modal>

      <form
        onSubmit={handleVerify}
        className="flex w-full h-full justify-center items-center"
      >
        <div className="max-w-4/12 dark:bg-slate-800/5 inset-shadow-slate-200/25 shadow-xs inset-shadow-xs bg-white/5 rounded-2xl p-12 flex flex-col justify-center gap-6 flex-1 w-full">
          
          {/* Logo Section */}
          <div className='flex justify-center items-center gap-2'>
            <img src="/pic/Robot Thumb Up with Artificial Intelligence.png" className='h-8 w-8' alt="Logo" />
            <p className="dark:text-slate-200 font-semibold">HRDashboard</p>
          </div>

          {/* Header Text */}
          <div className='flex flex-col justify-center text-center gap-2'>
            <p className="dark:text-slate-200 text-2xl font-bold">OTP verification</p>
            <p className="dark:text-slate-200 text-lg font-normal text-gray-600">
              We have sent a verification code to email address <span className="font-semibold text-slate-900">{location.state?.email || "your email"}</span>.
              <button 
                type="button" 
                onClick={handleWrongEmail}
                className="ml-2 text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Wrong Email?
              </button>
            </p>
          </div>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-4 py-4">
            {otp.map((data, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-16 h-16 text-center text-2xl font-bold border-1 rounded-xl outline-none transition-all
                  ${isError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-green-600'}
                  dark:bg-slate-800 dark:text-white`}
              />
            ))}
          </div>

          {isError && (
            <p className="text-red-500 text-sm font-semibold text-center -mt-4">
              Invalid OTP. Please try again.
            </p>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-slate-900 dark:bg-slate-800 text-slate-100 py-3 rounded-md text-sm font-semibold cursor-pointer dark:hover:bg-slate-300 dark:hover:text-slate-600 hover:bg-slate-800 transition-colors"
          >
            Verify
          </button>

          {/* Resend Link */}
          <p className="text-center text-gray-500 text-sm font-medium">
            Didn't receive the code? <button type="button" onClick={handleResend} className="text-slate-900 font-bold hover:underline cursor-pointer">Resend</button>
          </p>
          
        </div>
      </form>
    </div>
  );
}

export default OTPVerification;