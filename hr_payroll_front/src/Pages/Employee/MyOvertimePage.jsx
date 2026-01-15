import React, { useState, useEffect } from 'react';
import Header from '../../Components/Header';
import Table from '../../Components/Table';
import useAuth from '../../Context/AuthContext';

const MyOvertimePage = () => {
    const { axiosPrivate, user: authUser } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosPrivate.get('/attendances/requests/overtime/');
                const raw = response.data.results || response.data || [];
                const empId = authUser?.employee_id ? Number(authUser.employee_id) : null;
                const isEmployee = authUser?.role && authUser.role.toLowerCase().includes('employee');

                let filtered = raw;
                // For employees, show only assignments that include them
                if (isEmployee && empId) {
                    filtered = raw.filter((item) => {
                        if (Array.isArray(item.employees)) return item.employees.includes(empId);
                        return false;
                    });
                }

                // Normalize manager_name fallback
                filtered = filtered.map((item) => ({
                    ...item,
                    manager_name: item.manager_name || item.manager || '-'
                }));

                setData(filtered);
            } catch (error) {
                console.error("Error fetching overtime data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [axiosPrivate, authUser]);

    const tableStructure = [
        { type: "text", key: "date" },
        { type: "text", key: "hours" },
        { type: "text", key: "manager_name" },
        { type: "text", key: "justification" },
        { type: "status", key: "status" },
    ];

    const tableHeaderTitles = ["Date", "Hours", "Manager", "Justification", "Status"];

    return (
        <div className="p-6 h-screen overflow-auto scrollbar-hidden">
            <div className="mb-6">
                <Header 
                    Title="My Overtime Assignments" 
                    subTitle="View your assigned overtime hours and justifications." 
                />
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center text-slate-500">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-2 w-24 bg-slate-200 rounded mb-4"></div>
                            <div className="text-sm font-medium">Loading your assignments...</div>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="text-slate-400 mb-2">No overtime assignments found.</div>
                        <div className="text-xs text-slate-500">Assignments will appear here once initiated by your manager.</div>
                    </div>
                ) : (
                    <Table 
                        Data={data} 
                        Structure={tableStructure}
                        title={tableHeaderTitles}
                        ke={['date', 'hours', 'manager_name', 'justification', 'status']}
                        clickable={false}
                    />
                )}
            </div>
        </div>
    );
};

export default MyOvertimePage;
