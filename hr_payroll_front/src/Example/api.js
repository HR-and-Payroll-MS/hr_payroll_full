// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "what ever" || "", // set in env e.g. http://localhost:4000
  withCredentials: true,
  headers: {
    "Accept": "application/json",
  },
});

// Employees search: GET /api/employees?search=...
export async function searchEmployees(query) {
  const res = await api.get("/api/employees", {
    params: { search: query },
  });
  return res.data; // expect array of employees: { id, name, avatar?, department? }
}

// Upload documents: POST /api/documents (FormData)
export async function uploadDocuments(formData, onUploadProgress) {
  const res = await api.post("/api/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data; // expect created document(s)
}

// Get documents list: GET /api/documents?employeeId=&search=
export async function fetchDocuments(params = {}) {
  const res = await api.get("/api/documents", { params });
  return res.data; // expect array of document objects
}

// Delete document: DELETE /api/documents/:id
export async function deleteDocument(id) {
  const res = await api.delete(`/api/documents/${id}`);
  return res.data;
}

// Add to your existing api.js
export async function fetchEmployeeAttendance({ employeeId, month, year, status }) {
  const res = await api.get(`/api/attendance`, {
    params: { employeeId, month, year, status },
  });
  return res.data; // expect array: { date, checkIn, checkOut, status, hours, notes }
}

export async function fetchAttendanceSummary(employeeId) {
  const res = await api.get(`/api/attendance/summary`, {
    params: { employeeId },
  });
  return res.data; // e.g. { totalDays, present, absent, late, leave }
}



export async function fetchMyAttendance() {
  // Simulated API call
  // You can later connect to your backend route /api/my-attendance
  return {
    summary: {
      totalDays: 30,
      present: 25,
      absent: 3,
      late: 1,
      leaveTaken: 2,
      leaveRemaining: 8,
    },
    activity: [
      // For Nivo Calendar: { day: 'YYYY-MM-DD', value: number }
      { day: "2025-11-01", value: 1 },
      { day: "2025-11-02", value: 0 },
      { day: "2025-11-03", value: 1 },
      { day: "2025-11-04", value: 1 },
      { day: "2025-11-05", value: 0 },
      { day: "2025-11-06", value: 1 },
      { day: "2025-11-07", value: 1 },
      { day: "2025-11-08", value: 1 },
      { day: "2025-11-09", value: 0 },
      // add more for realistic month coverage
    ],
    trend: [
      { month: "Jan", present: 22, absent: 2, leave: 1 },
      { month: "Feb", present: 20, absent: 4, leave: 2 },
      { month: "Mar", present: 24, absent: 1, leave: 0 },
    ],
  };
}


// Download link could be provided directly from document.fileUrl returned by API
export default api;