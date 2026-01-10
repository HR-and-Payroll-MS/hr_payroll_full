import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  searchEmployees,
  uploadDocuments,
  fetchDocuments,
  deleteDocument,
} from '../../../Example/api';
import UploadDrawer from '../../../Example/UploadDrawer';
import PreviewModal from '../../../Example/PreviewModal';
import InputField from '../../../Components/InputField';
import Table from '../../../Components/Table';
import Icon from '../../../Components/Icon';
import Header from '../../../Components/Header';
import useAuth from '../../../Context/AuthContext';
import DocumentList from '../../../Components/DocumentList';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const PreviewPanel = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 p-4 overflow-y-auto">
      <div className="mb-4 border-b pb-2 dark:border-slate-700">
        <h3 className="text-lg font-bold dark:text-slate-100">Document Information</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Type: {data?.document_type || "General"}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Date: {data?.uploaded_at ? new Date(data.uploaded_at).toLocaleDateString() : "-"}</p>
      </div>
      
      {data?.notes && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">Notes</p>
          <p className="text-sm dark:text-slate-200">{data.notes}</p>
        </div>
      )}

      <div className="flex-1 min-h-[500px] border rounded-md overflow-hidden">
        <DocumentList files={[data]} justOpen={true} />
      </div>
    </div>
  );
};

export default function UploadDocuments() {
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState("");//for debug change it to employee i mean the null
  const [employeesOptions, setEmployeesOptions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const {axiosPrivate} = useAuth();
  const key2 = [['name'], ['document_type'], ['uploaded_at'], ['uploaded_by_photo', 'uploaded_by_name', 'uploaded_by_job_title'], ['notes'], ['id']]
  const title = ['document', 'Type', 'UploadedOn', 'UploadedBy', 'Notes', 'Actions']
  const structure = [82, 1, 81, 3, 83, 61]
  const loadDocuments = useCallback(async (employeeId) => {
    setLoadingDocs(true);
    try {

      const res = await axiosPrivate.get(`/employees/${employeeId}/`);
      
      setDocuments(res.data?.documents.files|| [])
      // console.log('employeeId', employeeId);
      console.log("res.data", res.data?.documents.files);
      // console.log('fetched docs', res.data.documents);
    } catch (err) {
      console.error('fetch docs error', err);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
    // setDocuments(response)
  }, []);
  
  useEffect(() => {
    if (selectedEmployee?.id) {
      loadDocuments(selectedEmployee.id);
    } else {
      setDocuments([]);
    }
  }, [selectedEmployee, loadDocuments]);
  const handleUpload = async ({ files, type, notes, onProgress }) => {
  if (!selectedEmployee?.id) {
    console.error("No employee selected");
    return;
  }

  try {
    const formData = new FormData();

    // Backend fields (adjust names if backend differs)
    formData.append("document_type", type || "");
    formData.append("notes", notes || "");

    // Normalize files
    const docs =
      files instanceof File
        ? [files]
        : files?.files
        ? Array.from(files.files)
        : Array.isArray(files)
        ? files
        : [];

    if (!docs.length) {
      console.error("No files to upload");
      return;
    }

    docs.forEach((file) => {
      formData.append("documents", file); // backend expects "documents"
    });

    // Debug (FormData can't be console.logged directly)
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const response = await axiosPrivate.post(
      `/employees/${selectedEmployee.id}/upload-document/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress(percent);
          }
        },
      }
    );

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error uploading documents:",
      error.response?.data || error.message
    );
    throw error;
  }
};

//  const handleUpload = async ({ files, type, notes, onProgress }) => {

//  const uploadData = new FormData();
// uploadData.append("name", "type");
// const docs = files?.files || files; 

// if (docs) {
//   const files = docs instanceof File ? [docs] : Array.from(docs);
//   files.forEach(file => uploadData.append("documents", file));
// }

// try {
//   // console.log("going")
//   console.log(uploadData ,"upload dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
//   console.log(selectedEmployee)
  
//     const response = await axiosPrivate.post(`/employees/${selectedEmployee?.id}/upload-document/`, uploadData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });
//     console.log("done")
//     // return response.data;
//   } catch (error) {
//     console.error("Error submitting profile:", error.response?.data || error);
//   } finally {
//     // setLoading(false)
//   }

//   console.log(files)
//     // if (!selectedEmployee)
//     //   throw new Error('Employee must be selected before uploading.');
//     // const form = new FormData();
//     // form.append('employeeId', selectedEmployee.id);
//     // form.append('type', type);
//     // form.append('notes', notes || '');
//     // files.forEach((f) => form.append('files', f));
//     // setUploading(true);
//     // try {
//     //   const res = await uploadDocuments(form, (ev) => {
//     //     if (onProgress) onProgress(Math.round((ev.loaded * 100) / ev.total));
//     //   });
//     //   setDocuments((prev) => [...res, ...prev]);
//     //   return res;
//     // } finally {
//     //   setUploading(false);
//     // }
//   };
    const handleEmployeeSelect = (emp) => {
    // console.log("Selected employee:", emp);
    setSelectedEmployee(emp);
    loadDocuments(emp.id); // send ID only
  };
  const handleDelete = async (docId) => {
    const prev = documents;
    setDocuments((d) => d.filter((x) => x.id !== docId));
    try {
      await axiosPrivate.delete(`/employees/documents/${docId}/`);
    } catch (err) {
      console.error('delete failed', err);
      setDocuments(prev); // rollback
    }
  };
// console.log('Employee', selectedEmployee);
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <Header Title={"Employee Documents"} subTitle={"Upload and manage employee"}/>
        <div className="flex items-center gap-3">
          <InputField placeholder={'Search Employee'} apiEndpoint="/employees/" displayKey="fullname" onSelect={(item) => handleEmployeeSelect(item)} />          
          <button onClick={() => setDrawerOpen(true)} disabled={!selectedEmployee} className={`inline-flex items-center gap-2 px-4 py-2 rounded shadow-sm text-sm ${ selectedEmployee ? 'bg-slate-800 hover:bg-slate-950 hover:cursor-pointer dark:text-slate-700 dark:bg-slate-300 dark:hover:bg-slate-50 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            <Icon name={"Plus"} className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </header>
      <main>
        <div id="firstdiv" className="mb-4">
          <p className="text-sm dark:text-slate-300">Selected Employee:</p>
          {selectedEmployee ? (
            <div className="flex items-center gap-3 mt-2">
              {selectedEmployee?.general?.photo ? (
                <img
                  src={`${BASE_URL}${selectedEmployee.general.photo}`}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-slate-600 shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 flex items-center justify-center text-sm font-bold border border-gray-200 dark:border-slate-600 shadow-sm">
                  {(selectedEmployee?.general?.fullname || "NA")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              )}
              <div>
                <div className="font-semibold dark:text-slate-100">{selectedEmployee?.general?.fullname}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedEmployee.department || selectedEmployee?.general?.emailaddress}
                </div>
              </div>
              <button
                className="ml-4 hover:cursor-pointer dark:hover:text-slate-50 hover:text-slate-950 text-sm text-slate-500"
                onClick={() => setSelectedEmployee(null)}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="mt-2 text-slate-500">
              No employee selected. Search above to pick an employee.
            </div>
          )}
        </div>
        {/* <Table Data={employee.documents.files} Structure={structure} ke={key2} title={title} onRowClick={(data) => console.log(data)} /> */}
        {/* the upper table is to debug with out connection */}
        <Table Data={documents} Structure={structure} ke={key2} title={title} components={PreviewPanel} D1={handleDelete} onRowClick={(data) => console.log(data)} />
       </main>

      <UploadDrawer open={drawerOpen} onClose={setDrawerOpen} employee={selectedEmployee} onUpload={async (payload) => { await handleUpload(payload); setDrawerOpen(false);}} uploading={uploading} />
      {/* <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} /> */}
    </div>
  );
}


