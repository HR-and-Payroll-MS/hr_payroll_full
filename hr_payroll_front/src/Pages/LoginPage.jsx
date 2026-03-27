import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; 
import useAuth from '../Context/AuthContext';
import useForm from '../Hooks/useForm';
import Modal from '../Components/Modal';

export default function Login() {  
  const { login, auth } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  // Inside Login.jsx
useEffect(() => {
  // Only redirect to Index if we actually have a user
  if (auth?.user) {
    navigate('/', { replace: true });
  }
}, [auth, navigate]);
 
  const handleForgotPassword = () => {
    navigate('/Forgot_Password');
  };

  const handleLogin = async (formData) => {
    setLoading(true);
    setMessage('');
    try {
      await login(formData.username, formData.password);
    } catch (err) {
      if (!err.response) {
        setMessage('Cannot reach authentication server. Please try again in a moment.');
      } else {
        setMessage(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const { values, handleChange, handleSubmit } = useForm(
    { username: '', password: '' },
    handleLogin
  );

  const formContainer = (
    <div
      id="form_container"
      className="justify-center flex-1 flex flex-col p-8 dark:bg-slate-800 bg-white text-black relative"
    >
      <Modal isOpen={loading} location={'center'} >
        <div className="flex items-center justify-center h-screen">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200"></div>
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin"></div>
          </div>
        </div>
      </Modal>

      {/* 1. TOP LOGO & BRANDING */}
      <div className="flex flex-col items-center mt-4">
        <img 
          src="/pic/Robot Thumb Up with Artificial Intelligence.png" 
          className="h-14 w-14 mb-2 animate-bounce-slow" 
          alt="Logo" 
        />
        <h1 className="text-xl font-bold tracking-tight dark:text-white uppercase">HR Portal</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-medium text-gray-400 uppercase">System Online</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col items-center gap-5 p-7"
      >
        <div className="flex flex-col justify-center gap-5 flex-1 w-full">
          <p className="py-2 dark:text-slate-200 flex justify-center text-sm font-medium text-gray-500">
            Secure Access Terminal
          </p>

          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="w-full dark:text-slate-200 text-xs font-semibold uppercase tracking-wide" htmlFor="email">
                Email Address <span className="text-red-700">*</span>
              </label>
              <input
                className="my-1 border dark:text-slate-300 dark:border-slate-600 border-gray-300 p-2.5 rounded w-full outline-none focus:border-green-600 transition-all"
                type="email"
                onChange={handleChange}
                value={values.username}
                name="username"
                id="email"
                placeholder="enter your email"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="w-full dark:text-slate-200 text-xs font-semibold uppercase tracking-wide" htmlFor="password">
                Password <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  className="my-1 border dark:text-slate-300 dark:border-slate-600 border-gray-300 p-2.5 rounded w-full outline-none focus:border-green-600 transition-all"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handleChange}
                  value={values.password}
                  id="password"
                  placeholder="enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {message && <p className="text-red-500 text-[11px] mt-1 font-medium">{message}</p>}
            </div>
          </div>

          <div className="flex justify-between w-full">
            <div className="flex items-center">
              <input type="checkbox" id="rememberme" className="w-3.5 h-3.5 cursor-pointer accent-green-600" />
              <label htmlFor="rememberme" className="px-2 text-xs text-gray-500 font-semibold cursor-pointer">
                Remember Me
              </label>
            </div>
            <p 
              onClick={handleForgotPassword} 
              className="text-xs dark:hover:text-slate-200 hover:text-slate-950 cursor-pointer text-gray-500 font-semibold"
            >
              Forgot Password?
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-slate-100 py-3 rounded-md text-sm font-semibold dark:hover:bg-slate-950 hover:bg-slate-800 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all active:scale-[0.98] shadow-lg shadow-slate-200 dark:shadow-none"
          >
            Login to Dashboard
          </button>

          <div className="mt-2 text-center">
             <p className="text-[11px] text-gray-400 font-medium">
                Trouble logging in? <br />
                <span className="text-blue-600 cursor-pointer hover:underline">Contact System Administrator</span>
             </p>
          </div>
        </div> 
      </form>

      {/* 3. PROFESSIONAL FOOTER */}
      <div className="mt-auto border-t pt-4 dark:border-slate-700">
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <p>© 2025 HR Ecosystem</p>
          <div className="flex gap-3">
            <span className="cursor-pointer hover:text-gray-600">Privacy</span>
            <span className="cursor-pointer hover:text-gray-600">Support</span>
          </div>
        </div>
      </div>
    </div>
  );

  const image_div = (
    <div id="image_div" className="sm:hidden border-r-2 border-green-600 md:hidden lg:flex flex-col flex-1">
      <img src="/pic/image.png" alt="hr" className="flex-3 overflow-hidden object-cover" />
      <div className="p-8 flex-1 border-t-4 border-green-600 bg-slate-800 dark:bg-white">
        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">HR Solutions</p>
        <p className="text-4xl font-semibold py-2 text-slate-300 dark:text-slate-900">
          Let's empower your employees today.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          The all-in-one platform for workforce management, payroll, and organizational excellence.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 py-5 px-48 h-screen dark:bg-slate-950 bg-slate-100 w-full flex justify-center">
      <div className="flex h-full w-full bg-amber-700 sm:flex-col lg:flex-row rounded shadow overflow-hidden">
        {image_div}
        {formContainer}
      </div>
    </div>
  );
}