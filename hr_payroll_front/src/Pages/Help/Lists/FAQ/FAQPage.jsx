import React, { useState, useEffect } from 'react';
import useAuth from '../../../../Context/AuthContext';
import { getLocalData } from '../../../../Hooks/useLocalStorage';
import FAQItem from './FAQItem';
import FAQModal from './FAQModal';

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faqs, setFaqs] = useState([]); // Initialize as empty array
  const [currentEditItem, setCurrentEditItem] = useState(null);

  // LOGGING: Check User Role
  const role = getLocalData('role');
  const [userRole] = useState(role || 'HR_ADMIN');
  console.log("FAQPage: Initialized. User Role LocalStorage:", role, "State:", userRole);

  const { axiosPrivate } = useAuth();

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
      console.log("FAQPage: Fetching FAQs...");
      try {
          const res = await axiosPrivate.get('/support/faqs/');
          console.log("FAQPage: Fetch Success. Status:", res.status, "Data:", res.data);
          
          if (Array.isArray(res.data)) {
            setFaqs(res.data);
            console.log("FAQPage: State updated with", res.data.length, "items.");
          } else if (res.data?.results && Array.isArray(res.data.results)) {
            // Handle Pagination
            setFaqs(res.data.results);
            console.log("FAQPage: State updated with", res.data.results.length, "items (Paginated).");
          } else {
            console.error("FAQPage: API returned unknown format:", res.data);
            setFaqs([]);
          }
      } catch(e) { 
        console.error("FAQPage: Fetch Failed!", e);
        console.error("Error Details:", e.response ? e.response.data : e.message);
        setFaqs([]); 
      }
  }

  const handleAddNew = () => {
    console.log("FAQPage: Handle Add New Clicked");
    setCurrentEditItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (faq) => {
    console.log("FAQPage: Handle Edit Clicked for ID:", faq.id);
    setCurrentEditItem(faq);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    console.log("FAQPage: Handle Delete ID:", id);
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
          const res = await axiosPrivate.delete(`/support/faqs/${id}/`);
          console.log("FAQPage: Delete Success. Status:", res.status);
          // Refetch to be sure
          fetchFaqs();
      } catch(e) { 
        console.error("FAQPage: Delete Failed", e);
        alert("Failed to delete item.");
      }
    }
  };

  const handleSave = async (formData) => {
    console.log("FAQPage: Handle Save. Payload:", formData);
    try {
        let res;
        if (currentEditItem) {
          console.log("FAQPage: Sending PATCH to", `/support/faqs/${currentEditItem.id}/`);
          res = await axiosPrivate.patch(`/support/faqs/${currentEditItem.id}/`, formData);
        } else {
          console.log("FAQPage: Sending POST to /support/faqs/");
          res = await axiosPrivate.post('/support/faqs/', formData);
        }
        
        console.log("FAQPage: Save Response Success. Status:", res.status, "Data:", res.data);
        alert(`Successfully Saved! Server returned: ${res.statusText || "OK"}`);

        // Force Refetch to prove persistence
        console.log("FAQPage: Refetching from server...");
        await fetchFaqs();
        
        setIsModalOpen(false);
    } catch(e) { 
        console.error("FAQPage: Save Failed!", e);
        const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : (e.message || "Unknown Error");
        console.error("FAQPage: Error Details:", errorMsg);
        alert(`SAVE FAILED!\nServer Message: ${errorMsg}\n\nCheck console (F12) for full logs.`);
    }
  };

  // Filter Logic Debug
  const filteredFaqs = (Array.isArray(faqs) ? faqs : []).filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase());
    // STRICT VISIBILITY CHECK FOR DEBUGGING
    const isVisible = (userRole === 'Manager' || userRole === 'HR_ADMIN') 
                      ? true 
                      : (faq.status === 'published');
    
    // Log hidden items to understand logic failures
    if (!isVisible && matchesSearch) {
       console.log("FAQPage: Hidden Item (Role:", userRole, "Status:", faq.status, ") ID:", faq.id);
    }
    return matchesSearch && isVisible;
  });

  return (
    <div className="flex flex-col w-full h-full p-8 gap-6 bg-white dark:bg-slate-800 transition-colors duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Help Center (Debug Mode)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Status: {faqs.length} loaded. Role: {userRole}</p>
        </div>
        
        {/* Action Button */}
        {(userRole === 'Manager' || userRole === 'HR_ADMIN') && (
          <div 
            onClick={handleAddNew}
            className="flex bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 items-center cursor-pointer px-5 py-2.5 rounded-md active:scale-95 transition-all shadow-lg"
          >
            <span className="text-xs font-bold uppercase tracking-wider">+ Add Question</span>
          </div>
        )}
      </div>

      <hr className="opacity-10 dark:opacity-5 border-slate-500" />

      {/* Search Bar Container */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="text"
          placeholder="Search questions..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-800/60 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FAQ Grid */}
      <div className="grid grid-cols-1 p-1 overflow-y-auto hover-bar lg:grid-cols-2 xl:grid-cols-3 gap-5 mt-2">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <FAQItem 
              key={faq.id} 
              faq={faq} 
              userRole={userRole} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-slate-500 dark:text-slate-500 font-medium">No questions found.</p>
            {faqs.length > 0 && <p className="text-xs text-red-500">Items exist but are hidden by filters/role.</p>}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <FAQModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          initialData={currentEditItem} 
        />
      )}
    </div>
  );
};

export default FAQPage;