import React, { useEffect, useState } from 'react';
import SummaryCard from '../Components/SummaryCard';
import RecentActivitiesTable from '../Components/RecentActivitiesTable';
import { QuickAccessGrid } from '../Components/QuickAccessCard';
import BarChartExample from '../Components/graphs/BarChartExample';
import LineChartExample from '../Components/graphs/LineChartExample';
import PieChartExample from '../Components/graphs/PieChartExample';
import { useTheme } from '../Context/ThemeContext';
import { getLocalData, setLocalData } from '../Hooks/useLocalStorage';
import WelcomeOverlay from '../Components/WelcomeOverlay';
import { useDashboard } from '../Context/DashboardContext';
import useAuth from '../Context/AuthContext';

function DashboardLayout() {
  const { theme } = useTheme();
  const { auth } = useAuth();
  const { 
    dashboardData, 
    loading, 
    error, 
    summaryCards, 
    recentActivities, 
    chartData, 
    quickAccess,
    refresh 
  } = useDashboard();
  
  const [isOpen, setClose] = useState(true);
  
  // Get role-specific welcome message
  const getWelcomeMessage = () => {
    const role = auth?.user?.role;
    switch (role) {
      case 'Manager':
        return "Enjoy the convenience of managing your company's employees";
      case 'Employee':
        return "Track your attendance, leaves, and payroll information";
      case 'Payroll':
        return "Manage payroll processing and generate reports";
      case 'Line_Manager':
        return "Monitor your team's performance and attendance";
      default:
        return "Welcome to the HR Dashboard";
    }
  };
  
  // Get role-specific chart labels
  const getChartLabels = () => {
    const role = auth?.user?.role;
    switch (role) {
      case 'Manager':
        return {
          bar: { title: 'Attendance by Department', bottomLegend: 'Department', leftLegend: 'Employees', indexBy: 'department' },
          line: { title: 'Monthly Payroll Trend', bottomLegend: 'Month', leftLegend: 'Amount ($)' },
          pie: { title: 'Leave Types Distribution' }
        };
      case 'Employee':
        return {
          bar: { title: 'Weekly Attendance', bottomLegend: 'Day', leftLegend: 'Hours', indexBy: 'day' },
          line: { title: 'Monthly Work Hours', bottomLegend: 'Month', leftLegend: 'Hours' },
          pie: { title: 'Attendance Status' }
        };
      case 'Payroll':
        return {
          bar: { title: 'Payroll by Department', bottomLegend: 'Department', leftLegend: 'Amount ($)', indexBy: 'department' },
          line: { title: 'Monthly Disbursements', bottomLegend: 'Month', leftLegend: 'Amount ($)' },
          pie: { title: 'Payroll Status' }
        };
      case 'Line_Manager':
        return {
          bar: { title: 'Team Daily Attendance', bottomLegend: 'Day', leftLegend: 'Employees', indexBy: 'day' },
          line: { title: 'Team Monthly Hours', bottomLegend: 'Month', leftLegend: 'Hours' },
          pie: { title: 'Team Status' }
        };
      default:
        return {
          bar: { title: 'Overview', bottomLegend: 'Category', leftLegend: 'Value' },
          line: { title: 'Trend', bottomLegend: 'Time', leftLegend: 'Value' },
          pie: { title: 'Distribution' }
        };
    }
  };
  
  const chartLabels = getChartLabels();
  
  useEffect(() => {
    if (getLocalData('hi') === "true") setClose(false);
  }, []);
  
  // Handle error state
  if (error) {
    return (
      <div className="h-full w-full p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full scrollbar-hidden w-full p-4 flex overflow-y-scroll flex-col gap-5">
      <WelcomeOverlay 
        Title='Welcome to HR Dashboard' 
        subTitle={getWelcomeMessage()} 
        isOpen={isOpen} 
        setClose={setClose}
      />
      
      {/* Summary Cards */}
      <div className="flex gap-4 flex-1 h-fit w-full">
        <SummaryCard data={summaryCards} loading={loading} />
      </div>
      
      {/* Charts Row */}
      <div className="flex gap-4 w-full flex-2">
        <div className="bg-gray-50 h-full shadow dark:shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-700 rounded-xl flex-1 overflow-hidden">
          <BarChartExample 
            theme={theme} 
            data={chartData?.bar}
            title={chartLabels.bar.title}
            axisBottomLegend={chartLabels.bar.bottomLegend}
            axisLeftLegend={chartLabels.bar.leftLegend}
            indexBy={chartLabels.bar.indexBy}
          />
        </div>
        <div className="bg-gray-50 h-full shadow dark:shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-700 rounded-xl flex-1 overflow-hidden">
          <LineChartExample 
            theme={theme} 
            data={chartData?.line}
            title={chartLabels.line.title}
            axisBottomLegend={chartLabels.line.bottomLegend}
            axisLeftLegend={chartLabels.line.leftLegend}
          />
        </div>
        <div className="bg-gray-50 h-full shadow dark:shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:bg-slate-700 rounded-xl flex-1 overflow-hidden">
          <PieChartExample 
            theme={theme} 
            data={chartData?.pie}
            title={chartLabels.pie.title}
          />
        </div>
      </div>
      
      {/* Recent Activities Table */}
      <div className="flex gap-4 rounded-xl shadow dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 flex-1 h-fit w-full bg-gray-50 dark:bg-slate-700 p-5">
        <RecentActivitiesTable activities={recentActivities} loading={loading} />
      </div>
      
      {/* Quick Access Buttons */}
      <div className="h-fit w-full">
        <QuickAccessGrid items={quickAccess} loading={loading} />
      </div>
    </div>
  );
}

export default DashboardLayout;




