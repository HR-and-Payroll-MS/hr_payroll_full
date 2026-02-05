import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosPublic } from '../api/axiosInstance';
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';
import Modal from '../Components/Modal';
import useAuth from '../Context/AuthContext';

function UpdatePassword() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Strength Check Logic
  const validation = {
    length: formData.password.length >= 8,
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
  };

  const isStrong = validation.length && validation.number && validation.special;
  const canSubmit = isStrong && validation.match;

  useEffect(() => {
    if (auth?.user?.role === 'Manager') navigate('/hr_dashboard');
    else if (auth?.user?.role === 'Payroll') navigate('/payroll');
    else if (auth?.user?.role === 'Line Manager') navigate('/manager_dashboard');
  }, [auth, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
        const { email, otp } = location.state || {};
        if (!email || !otp) {
            alert("Missing verification data. Please restart.");
            navigate('/Forgot_Password');
            return;
        }

        await axiosPublic.post('/users/reset-password/', { 
            email, 
            otp, 
            password: formData.password 
        });
        
        alert("Password reset successfully! Please login.");
        navigate('/Login');
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || "Failed to reset password.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[url('/pic/F25.png')] bg-contain bg-center">
      
      <Modal isOpen={loading} location={'center'}>
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200"></div>
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-green-500 animate-spin"></div>
          </div>
        </div>
      </Modal>

      <form onSubmit={handleSubmit} className="flex w-full h-full justify-center items-center">
        <div className="max-w-xl shadow bg-white rounded-2xl p-10 flex flex-col justify-center gap-4 flex-1 w-full mx-4">
          
          <div className='flex justify-center items-center gap-2'>
            <img src="/pic/Robot Thumb Up with Artificial Intelligence.png" className='h-8 w-8' alt="Logo" />
            <p className="font-semibold">HRDashboard</p>
          </div>

          <div className='text-center mb-2'>
            <p className="text-2xl font-bold">Setup New Password</p>
            <p className="text-gray-500">Your password must be different from previous used passwords.</p>
          </div>

          {/* New Password Input */}
          <div className="relative">
            <label className="text-xs font-semibold">New Password<span className="text-red-700">*</span></label>
            <div className="relative mt-1">
              <input
                type={showPass ? "text" : "password"}
                className={`w-full p-2.5 border rounded outline-none transition-all ${formData.password && !isStrong ? 'border-orange-400' : 'border-gray-300 focus:border-green-600'}`}
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <label className="text-xs font-semibold">Confirm Password<span className="text-red-700">*</span></label>
            <div className="relative mt-1">
              <input
                type={showConfirmPass ? "text" : "password"}
                className={`w-full p-2.5 border rounded outline-none transition-all ${formData.confirmPassword && !validation.match ? 'border-red-500' : 'border-gray-300 focus:border-green-600'}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-2.5 text-gray-400">
                {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Validity Checklist */}
          <div className="bg-gray-50 p-4 shadow rounded-lg space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password Requirements</p>
            <ValidationItem label="At least 8 characters" isValid={validation.length} />
            <ValidationItem label="At least one number" isValid={validation.number} />
            <ValidationItem label="At least one special character (!@#$)" isValid={validation.special} />
            <ValidationItem label="Passwords match" isValid={validation.match} />
          </div>

          <button 
            type="submit" 
            disabled={!canSubmit}
            className={`w-full py-3 rounded-md text-sm font-semibold transition-all shadow-lg
              ${canSubmit ? 'bg-slate-900 text-white cursor-pointer hover:bg-slate-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper Component for UI checklist
const ValidationItem = ({ label, isValid }) => (
  <div className="flex items-center gap-2 text-sm">
    {isValid ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-gray-300" />}
    <span className={isValid ? "text-green-700 font-medium" : "text-gray-400"}>{label}</span>
  </div>
);

export default UpdatePassword;