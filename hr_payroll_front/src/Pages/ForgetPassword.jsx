import React, { useEffect, useState } from 'react'
import Modal from '../Components/Modal'
import useAuth from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useForm from '../Hooks/useForm';
import { axiosPublic } from '../api/axiosInstance';

function ForgetPassword() {
 const { login, auth } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
  if (auth?.user?.role === 'Manager') navigate('/hr_dashboard');
  else if (auth?.user?.role === 'Payroll') navigate('/payroll');
  else if (auth?.user?.role === 'Line Manager') navigate('/manager_dashboard');
  else {<>unknown Actor logged in</>}
}, [auth, navigate]);


const BackToLogin = () => {
    navigate('/Login');
}

    const handlesub = async (formData) => {
    
    if (!formData.email) {
        alert("Please enter a valid email address.");
        return;
    }

    setLoading(true);
    setMessage('');
    try {
      await axiosPublic.post('/users/request-reset/', { email: formData.email });
      navigate('/verification', { state: { email: formData.email } });
    } catch (err) {
        console.error(err);
        setMessage(err.response?.data?.message || "Failed to send OTP");
        // Optional: Show error to user via modal or alert
        alert(err.response?.data?.message || "Failed to send OTP. Please check the email.");
    } finally {
        setLoading(false);
    }

  }; 
   
  const { values, handleChange, handleSubmit } = useForm(
    { email:'' },
    handlesub
  );
  return (
    <div className="h-screen w-screen bg-[url('/pic/F26.png')] dark:bg-slate-900 bg-no-repeat bg-cover bg-center ">
        
        
        
        <Modal isOpen={loading} location={'center'} >
        <div className="flex items-center justify-center h-screen">
        <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-blue-500 animate-spin">
        </div>
    </div>
</div></Modal>


<form
        onSubmit={handleSubmit}
        className=" flex w-full h-full  justify-center items-center"
        action=""
      >
        <div className="max-w-4/12 shadow-xs inset-shadow-2xs bg-white/50 dark:bg-slate-800/75 rounded-2xl p-12 flex flex-col justify-center gap-2 flex-1 w-full ">
          <div className='flex justify-center'>
            <img src="/pic/Robot Thumb Up with Artificial Intelligence.png" className='h-8 w-8' alt="" />
            <p className="py-2 dark:text-slate-200 flex justify-center font-semibold">
                HRDashboard
            </p>
          </div>
          <div className='flex flex-col justify-center'>
            <p className="py-2 dark:text-slate-200 flex text-2xl font-bold justify-center ">
                Reset your password
            </p>
            <p className="py-2 text-center dark:text-slate-200 flex text-xl font-normal justify-center ">
                Enter your email address and we'll send you password reset instructions.
            </p>
          </div>
          <div className="py-2">
            <label className="w-full dark:text-slate-200 text-xs font-semibold " htmlFor="email">
              Registered Email<span className="text-red-700">*</span>
            </label>
            <input
              className="my-1 border dark:text-slate-300 outline-green-600 dark:border-slate-600 border-gray-300 p-2 rounded w-full"
              type="email"
              onChange={handleChange}
              value={values.email}
              name="email"
              id="email"
              placeholder="Input your registered email"
            />
          </div>
          <button type="submit" className="items-center  transition-all duration-300 transform hover:-translate-y-1 justify-center bg-slate-900 dark:bg-slate-600 cursor-pointer text-slate-100 inline-flex px-32 py-2.5 rounded-md text-sm font-semibold ">
            Send OTP on My email
          </button>
          <button type="button" onClick={BackToLogin} className="items-center cursor-pointer justify-center  inline-flex px-32 py-2.5 border-slate-400 border-2 dark:hover:border-slate-300 hover:border-slate-600 hover:text-slate-600  dark:hover:text-slate-200 rounded-md text-sm font-semibold text-gray-500">
            Back to Login
          </button>
          
        </div> 
      </form>
      </div>
  )
}

export default ForgetPassword