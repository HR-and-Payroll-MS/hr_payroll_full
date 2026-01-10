import Dropdown from '../Dropdown';
import { User, MapPin, PhoneCall } from 'lucide-react';

const genderOptions = ["Male", "Female"];
const maritalStatusOptions = ["Single", "Married", "Divorced", "Widowed"];
const nationalityOptions = ["Ethiopian", "Kenyan", "Sudanese", "Somali", "American", "British", "Other"];

const StepGeneral = ({ data , onChange }) => {
    const Personal_info = (
        <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all mb-8 border border-slate-100 dark:border-transparent">
            <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
                <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">personal Info</p>
                <User size={18} className="opacity-40 text-green-500 dark:text-green-400" />
            </div>
            <div id="left" className="flex gap-5 p-4 justify-start items-start flex-wrap">
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">First Name</p>
                    <input type="text" value={data.firstname} onChange={(e) => onChange({ firstname: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />   
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Last Name</p>
                    <input type="text" value={data.lastname} onChange={(e) => onChange({ lastname: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />   
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Gender</p>
                    <div className="w-full">
                        <Dropdown padding='p-1.5' options={genderOptions} placeholder={data.gender || "Select Gender"} onChange={(e) => onChange({ gender: e })} />
                    </div>
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Date of Birth</p>
                    <input type="date" value={data.dateofbirth} onChange={(e) => onChange({ dateofbirth: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />   
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Marital Status</p>
                    <div className="w-full">
                        <Dropdown padding='p-1.5' options={maritalStatusOptions} placeholder={data.maritalstatus || "Select Status"} onChange={(e) => onChange({ maritalstatus: e })} />
                    </div>
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Nationality</p>
                    <div className="w-full">
                        <Dropdown padding='p-1.5' options={nationalityOptions} placeholder={data.nationality || "Select Nationality"} onChange={(e) => onChange({ nationality: e })} />
                    </div>
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Personal TaxID</p>
                    <input type="text" value={data.personaltaxid} onChange={(e) => onChange({ personaltaxid: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Email Adress</p>
                    <input type="text" value={data.emailaddress} onChange={(e) => onChange({ emailaddress: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />  
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Social Insurance</p>
                    <input type="text" value={data.socialinsurance} onChange={(e) => onChange({ socialinsurance: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />   
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Health Insurance</p>
                    <input type="text" value={data.healthinsurance} onChange={(e) => onChange({ healthinsurance: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />   
                </div>
                <div className="w-96 flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Phone Number</p>
                    <input type="number" value={data.phonenumber} onChange={(e) => onChange({ phonenumber: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />   
                </div>
            </div>
        </div>
    );

    const Address = (
        <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all mb-8 border border-slate-100 dark:border-transparent">
            <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
                <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Address</p>
                <MapPin size={18} className="opacity-40 text-green-500 dark:text-green-400" />
            </div>
            <div id="left" className="flex flex-col gap-5 p-4 justify-start items-start ">
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Primary address</p>
                    <input type="text" value={data.primaryaddress} onChange={(e) => onChange({ primaryaddress: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Country</p>
                    <input type="text" value={data.country} onChange={(e) => onChange({ country: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">State/Province</p>
                    <input type="text" value={data.state} onChange={(e) => onChange({ state: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">City</p>
                    <input type="text" value={data.city} onChange={(e) => onChange({ city: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Post Code</p>
                    <input type="text" value={data.postcode} onChange={(e) => onChange({ postcode: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
            </div>
        </div>
    );

    const Emergency_Contact = (
        <div className="bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-all mb-4 border border-slate-100 dark:border-transparent">
            <div className="flex mx-4 py-4 border-b dark:border-slate-700 items-center">
                <p className="flex-1 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Emergency Contact</p>
                <PhoneCall size={18} className="opacity-40 text-green-500 dark:text-green-400" />
            </div>
            <div id="left" className="flex flex-col gap-5 p-4 justify-start items-start ">
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Full Name</p>
                    <input type="text" value={data.emefullname} onChange={(e) => onChange({ emefullname: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Phone Number</p>
                    <input type="number" value={data.emephonenumber} onChange={(e) => onChange({ emephonenumber: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />  
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">State/Province</p>
                    <input type="text" value={data.emestate} onChange={(e) => onChange({ emestate: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" />  
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">City</p>
                    <input type="text" value={data.emecity} onChange={(e) => onChange({ emecity: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
                <div className="flex-1 w-full flex gap-2 text-nowrap items-center">
                    <p className="min-w-40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Post Code</p>
                    <input type="text" value={data.emepostcode} onChange={(e) => onChange({ emepostcode: e.target.value })} className="w-full bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 outline-none focus:border-green-500 transition-all shadow-sm" /> 
                </div>
            </div>
        </div>
    );

    const General = (
        <div className="flex flex-col gap-4 scrollbar-hidden overflow-y-scroll pb-10">
            {Personal_info}
            {Address}
            {Emergency_Contact}
        </div>
    );

    return <>{General}</>;
};

export default StepGeneral;