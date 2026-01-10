import React from 'react'

import { useState } from 'react';
import { sidebarList } from '../Hooks/useSidebarContent';
import Icon from '../Components/Icon'
import SummaryCard from '../Components/SummaryCard';

function DashboardSkeleton() {
  const [list, setList] = useState(sidebarList["Manager"] || []);
  const top1 = (
    <div
      id="top"
      className="flex w-full justify-between items-center m-0.5 px-2.5"
    >
      <div className="flex items-center justify-center py-2.5">
        <img
          className={`h-9 transition-all duration-300 'block'
          `}
          src="/pic/Robot Thumb Up with Artificial Intelligence.png"
          alt=""
        />
      </div>

      <Icon
        name="PanelLeft"
        className="w-5 animate-shimmer h-5 cursor-pointer"
      />
    </div>
  );

  const top2 = (
    <div
      id="top2"
      className={`bg-green-600 animate-shimmer rounded-md p-2.5 px-5 flex w-full justify-between items-center `}
    >
      
      <Icon name="LayoutDashboard" className="w-4 h-4 text-gray-400" />
    </div>
  );

  const middle1 = (
    <div
      id="middle"
      className="flex flex-col w-full flex-1 my-4 overflow-y-scroll scrollbar-hidden gap-2"
    >
      {list.map((lists, index) =>
        (
          <div key={index} className="*:cursor-pointer">
            <div
             
              className={`bg-slate-50 animate-shimmer dark:hover:bg-slate-700 flex w-full 
                 justify-between
              items-center p-2.5 transition-all`}
            >
              <div className="flex items-center gap-1.5 justify-center">
                <Icon
                  name={lists.Icons}
                  className={`w-4 h-4 ${
                    lists.Visible ? 'text-blue-500' : 'text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* sub-items */}
            
          </div>
        )
      )}
    </div>
  );

  const bottom = <div id="bottom" className="w-full flex flex-col items-center py-3.5">
      
          <div className="flex w-full  justify-between pr-3 animate-shimmer items-center m-0.5">
            <div className="flex items-center gap-1.5 justify-center py-2.5">
              <Icon name="HelpCircle" className="w-5 h-5 text-slate-400" />
              <p className="font-semibold text-transparent text-sm dark:text-slate-300">
                Help Center
              </p>
            </div>
            <div className="text-xs rounded-full font-semibold items-center animate-shimmer text-transparent px-1">
              <p className="m-0.5 text-transparent">8</p>
            </div>
          </div>

          <div className="flex w-full justify-between animate-shimmer items-center m-0.5">
            <div className="flex items-center gap-1.5 justify-center py-2.5">
              <Icon name="Settings" className="w-5 h-5 text-slate-400" />
              <div className="Setting ">
                <p className="font-semibold  text-transparent   text-sm dark:text-slate-300">
                  Settings
                </p>
              </div>
            </div>
          </div>

          <div
            className={`dark:bg-slate-900 flex gap-0.5 rounded-4xl cursor-pointer bg-gray-50 h-fit w-full justify-around items-center m-0.5`}
          >
            <div
              className={`flex flex-1  rounded-4xl m-1 h-9 animate-shimmer items-center gap-1.5 justify-center py-2.5`}
            >
              <Icon name="Sun" className="w-4 h-4" />
              <p className="dark:text-slate-100 font-semibold text-transparent text-sm">
                Light
              </p>
            </div>
            <div
             
              className={`flex flex-1 rounded-4xl animate-shimmer m-1 h-9 items-center gap-1.5 justify-center py-2.5`}
            >
              <Icon name="Moon" className="w-4  h-4" />
              <p className="dark:text-slate-100 text-transparent font-semibold text-sm">
                Dark
              </p>
            </div>
          </div>
    </div>

const sidebar =<div
      className={`bg-white dark:bg-slate-800 dark:text-white flex h-full  
        w-64
       transition-all duration-300 flex-col items-center shadow px-2.5 py-0.5`}
    >
      {top1}
      {top2}
      {middle1}
      {bottom}
    </div>

const Header = <div className={`bg-white flex justify-evenly shadow h-14 gap-3 z-50  dark:bg-slate-800 dark:text-white `}> 
        <div id="left" className="flex py-2.5 w-2/5  justify-between items-center p-4 ">
            <div className={`flex items-center animate-shimmer gap-1.5 justify-between bg-gray-100 w-full h-full px-1.5 rounded-md  dark:bg-slate-700 `}>
                <div className="flex items-center gap-1.5 px-2.5 py-2 h-full">
                    <img className="h-4 opacity-45" src="\svg\search-svgrepo-com.svg" alt="" />
                    <input className=" h-full  rounded w-full" type="email" name="email" id="email" placeholder="" />
                </div>
                <div className={`flex bg-white items-center justify-center gap-1.5 px-1.5 rounded-md  dark:bg-slate-700 `}>
                    <p className="text-lg font-bold text-transparent">x</p>
                    <p className="text-sm font-bold text-transparent">F</p>
                </div>
            </div>

        </div>
        <div id="middle" className="flex w-3/5 justify-start gap-7 items-center ">
                <p className={`font-semibold text-transparent animate-shimmer  text-sm  dark:font-slate-300 dark:text-slate-300 `}>Documents</p>
                <p className={`font-semibold text-transparent animate-shimmer  text-sm  dark:font-slate-300 dark:text-slate-300 `}>News</p>
                <p className={`font-semibold text-transparent animate-shimmer  text-sm  dark:font-slate-300 dark:text-slate-300 `}>Payslip</p>
                <p className={`font-semibold text-transparent animate-shimmer  text-sm  dark:font-slate-300 dark:text-slate-300 `}>Report</p>
        </div>
        <div id="right" className="flex w-1/5 justify-evenly items-center ">
                <div className='h-6 w-6 rounded-full animate-shimmer'></div>
                <div className='h-6 w-6 rounded animate-shimmer'></div>
                <div className="flex h-8 w-8 rounded-full animate-shimmer items-center">
                </div>
        </div>
    
    </div>
;

  const OutLine =<div className="h-full scrollbar-hidden w-full p-2.5 flex overflow-y-scroll flex-col gap-4">
      <div className="flex gap-4 flex-1 h-fit w-full">
        <SummaryCard classname='animate-shimmer text-transparent' />
      </div>
      <div className="flex gap-4  w-full flex-2">
        <div className="bg-gray-50 h-full animate-shimmer dark:bg-slate-700 rounded flex-1 ">
          {/* <BarChartExample themeMode={darkMode ? 'dark' : 'light'} /> */}
          
        </div>
        <div className="bg-gray-50 h-full animate-shimmer dark:bg-slate-700 rounded flex-1 ">
          
        </div>
        <div className="bg-gray-50 h-full animate-shimmer dark:bg-slate-700 rounded flex-1 ">
          
        </div>
      </div>
      <div className="flex gap-4 rounded flex-1 h-fit w-full  animate-shimmer">
        <div className="w-full h-54">   </div>
      </div>
      <div className="h-fit flex w-full gap-4">
        <div className="animate-shimmer text-transparent h-full p-2 rounded flex-1 ">1</div>
        <div className="animate-shimmer text-transparent h-full p-2 rounded flex-1 ">1</div>
        <div className="animate-shimmer text-transparent h-full p-2 rounded flex-1 ">1</div>
      </div>
    </div>





  return (
     <div
      className={`bg-gray-50 flex h-screen gap-0.5  dark:bg-slate-900`}
    >
      {sidebar}
      <div className="flex-1 h-full flex flex-col">
        {Header}
        <div className="h-full p-4 flex-1 overflow-y-scroll scrollbar-hidden">
          <div className="h-full w-full bg-white rounded-md overflow-hidden dark:bg-slate-800">
            {OutLine}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton