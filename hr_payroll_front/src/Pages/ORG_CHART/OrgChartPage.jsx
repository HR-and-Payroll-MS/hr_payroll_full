import React, { useState, useEffect } from 'react';
import OrgChartEditor from './OrgChartEditor';
import { getLocalData } from '../../Hooks/useLocalStorage';
import { ReactFlowProvider } from 'reactflow';
import useAuth from '../../Context/AuthContext';

const OrgChartPage = () => {
  const { axiosPrivate } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = getLocalData('role') || 'Manager'; 

  const initialMockData = {
    nodes: [
      { id: '1', type: 'orgCard', data: { isRoot: true, name: 'CEO', role: 'CEO', department: 'Executive', image: '' }, position: { x: 400, y: 0 } },
    ],
    edges: []
  };

  const fetchOrgChart = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/employees/org-chart/');
      // Use backend data if available, otherwise use mock
      if (response.data && response.data.nodes && response.data.nodes.length > 0) {
        setChartData(response.data);
      } else {
        setChartData(initialMockData);
      }
    } catch (e) {
      console.error("Failed to load org chart", e);
      setError(e.message);
      // Fallback to mock data
      setChartData(initialMockData);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  // Save org chart to backend
  const handleSaveChart = async (data) => {
    try {
      await axiosPrivate.put('/employees/org-chart/', data);
      alert('Org chart saved successfully!');
      fetchOrgChart();
    } catch (e) {
      console.error("Failed to save org chart", e);
      alert('Failed to save org chart');
    }
  };

  if (loading) return <div className="p-8 font-semibold text-slate-500">Initializing Org Chart...</div>;

  return (
    <div className="p-8 w-full h-[90vh]">
      {error && <div className="text-amber-500 text-sm mb-2">Using demo data (backend unavailable)</div>}
      <ReactFlowProvider>
        <OrgChartEditor initialData={chartData} userRole={role} onSave={handleSaveChart} />
      </ReactFlowProvider>
    </div>
  );
};

export default OrgChartPage;