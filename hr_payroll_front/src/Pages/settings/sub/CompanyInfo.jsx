import React, { useState, useEffect } from 'react';
import { getLocalData } from '../../../Hooks/useLocalStorage'; 
import useAuth from '../../../Context/AuthContext';

export default function CompanyInfo() {
    const { axiosPrivate } = useAuth();
    const [companyData, setCompanyData] = useState({
        name: "", website: "", countryCode: "", phone: "", email: "", bio: ""
    });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Get User Role
    const userRole = getLocalData('role'); 
    const canEdit = userRole === "Manager" || userRole === "ADMIN";

    const sanitizeData = (data) => {
        // Ensure HTTPS on website
        let website = data.website || "";
        if (website && !website.startsWith("http")) {
            website = "https://" + website;
        }
        return {
            ...data,
            website,
            name: data.name || "",
            countryCode: data.countryCode || "",
            phone: data.phone || "",
            email: data.email || "",
            bio: data.bio || ""
        };
    };

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                const response = await axiosPrivate.get('/company-info/');
                setCompanyData(sanitizeData(response.data));
            } catch (error) {
                console.error("Error fetching company data", error);
                // Fallback for testing
                setCompanyData({
                    name: "TechInnovate Solutions",
                    website: "https://www.techinnovate.com",
                    countryCode: "+251",
                    phone: "972334145",
                    email: "contact@techinnovate.com",
                    bio: "Bio text here..."
                });
            } finally {
                setLoading(false);
            }
        };
        fetchCompanyData();
    }, [axiosPrivate]);

    // This function updates the state as the HR manager types
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            // Ensure data is clean before sending
            const payload = sanitizeData(companyData);
            await axiosPrivate.put('/company-info/', payload);
            setCompanyData(payload); // Update local state with sanitized data
            setIsEditing(false); // Turn off edit mode after saving
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile on the server. Check if the website URL is valid.");
        }
    };

    // Styling constants
    const inputStyle = "w-full py-1.5 px-3.5 text-sm font-semibold border rounded-md border-gray-100 dark:border-slate-600 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const displayStyle = "py-1.5 px-3.5 text-sm font-semibold border rounded-md border-gray-100 dark:border-slate-600 dark:text-slate-100 bg-white dark:bg-transparent min-h-[38px] flex items-center";

    if (loading) return <div className="p-8 dark:text-slate-100">Loading...</div>;

    return (
        <div className="flex flex-col w-full p-8 gap-5 dark:bg-slate-800">
            <div className="flex justify-between items-center">
                <p className="text-xl font-semibold dark:text-slate-100 text-gray-800">Company Info</p>
                {isEditing && <span className="text-xs font-bold text-blue-500 animate-pulse">EDIT MODE ENABLED</span>}
            </div>
            <hr className="opacity-5 dark:opacity-10" />

            {/* Row 1: Name and Website */}
            <div className="flex flex-1 gap-5 justify-between items-center">
                <div className="flex-1 flex flex-col gap-2">
                    <p className="dark:text-slate-300 text-sm font-medium">Company Name <span className="text-red-500">*</span></p>
                    {isEditing ? (
                        <input 
                            name="name" 
                            value={companyData.name || ""} 
                            onChange={handleChange} 
                            className={inputStyle} 
                            placeholder="Enter Company Name"
                        />
                    ) : (
                        <div className={displayStyle}>{companyData.name}</div>
                    )}
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                    <p className="dark:text-slate-300 text-sm font-medium">Company Website <span className="text-red-500">*</span></p>
                    {isEditing ? (
                        <input 
                            name="website" 
                            value={companyData.website || ""} 
                            onChange={handleChange} 
                            className={inputStyle} 
                            placeholder="https://www.example.com"
                        />
                    ) : (
                        <div className="flex text-gray-700 dark:text-slate-100 px-3.5 border border-gray-100 dark:border-slate-600 items-center justify-between gap-1.5 rounded-md bg-white dark:bg-transparent min-h-[38px]">
                            <span className="text-sm font-semibold">{companyData.website}</span>
                           <img className="h-4 dark:invert opacity-50" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Contact Number and Email */}
            <div className="flex flex-1 gap-4 justify-between items-center">
                <div className="w-1/2 flex flex-col gap-2">
                    <p className="dark:text-slate-300 text-sm font-medium">Contact Number <span className="text-red-500">*</span></p>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <input 
                                    name="countryCode" 
                                    value={companyData.countryCode || ""} 
                                    onChange={handleChange} 
                                    className={`${inputStyle} w-1/4`} 
                                    placeholder="+251"
                                />
                                <input 
                                    name="phone" 
                                    value={companyData.phone || ""} 
                                    onChange={handleChange} 
                                    className={`${inputStyle} w-3/4`} 
                                    placeholder="911..."
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex text-gray-700 dark:text-slate-100 w-1/4 px-2 border border-gray-100 dark:border-slate-600 items-center justify-between rounded-md bg-white dark:bg-transparent">
                                    <span className="py-1.5 text-sm font-semibold">{companyData.countryCode}</span>
                                </div>
                                <div className={`${displayStyle} w-3/4`}>{companyData.phone}</div>
                            </>
                        )}
                    </div>
                </div>

                <div className="w-1/2 flex flex-col gap-2">
                    <p className="dark:text-slate-300 text-sm font-medium">Contact Email <span className="text-red-500">*</span></p>
                    {isEditing ? (
                        <input 
                            name="email" 
                            value={companyData.email || ""} 
                            onChange={handleChange} 
                            className={inputStyle} 
                            type="email"
                        />
                    ) : (
                        <div className={displayStyle}>{companyData.email}</div>
                    )}
                </div>
            </div>

            {/* Row 3: Bio */}
            <div className="flex-1 flex flex-col gap-2">
                <p className="dark:text-slate-300 text-sm font-medium">About Company <span className="text-red-500">*</span></p>
                {isEditing ? (
                    <textarea 
                        name="bio" 
                        value={companyData.bio || ""} 
                        onChange={handleChange} 
                        rows={4} 
                        className="w-full py-2.5 px-3.5 text-sm border rounded-md border-gray-100 dark:border-slate-600 dark:text-slate-100 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Tell us about the company..."
                    />
                ) : (
                    <div className="py-1.5 px-3.5 min-h-[120px] text-sm border rounded-md border-gray-100 dark:border-slate-600 dark:text-slate-100 bg-white dark:bg-transparent overflow-y-auto leading-relaxed">
                        {companyData.bio}
                    </div>
                )}
            </div>

            {/* Row 4: Buttons */}
            {canEdit && (
                <div className="flex gap-3 mt-4">
                    {!isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-8 py-3 rounded-md font-bold uppercase text-xs tracking-wider hover:opacity-90 active:scale-95 transition-all"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handleSave} 
                                className="bg-green-600 text-white px-8 py-3 rounded-md font-bold uppercase text-xs tracking-wider hover:bg-green-700 active:scale-95 transition-all"
                            >
                                Save Changes
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)} 
                                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-md font-bold uppercase text-xs tracking-wider hover:bg-gray-300 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}