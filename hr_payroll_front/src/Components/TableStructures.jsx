import React, { useState } from 'react';
import Icon from './Icon';
import FileDrawer from './FileDrawer';
import Drawer from './Drawer';
import AttendanceCorrectionPage from '../Pages/HR_Manager/Attendance/AttendanceCorrectionPage';
import PayrollReportDrawer from '../Pages/HR_Manager/payroll_management/PayrollReportDrawer';
import DocumentList from './DocumentList';
import PayslipTemplate from './PayslipTemplate';
import PayslipTemplate2 from './PayslipTemplate2';
import useAuth from '../Context/AuthContext';
// import { BASE_URL } from '../api/axiosInstance';

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

function EmptyComponent() {
  return <div>No component provided</div>;
}
const BASE_URL = import.meta.env.VITE_BASE_URL || '';
function TableStructures({
  data = '',
  id,
  D1,
  D2,
  item,
  Comps = EmptyComponent,
  nickname,
  rawData,
}) {
  const { axiosPrivate } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const deleteItem = () => {
    if (D1 && typeof D1 === 'function') {
      D1(data.id || data);
    } else {
      console.log('deleted', data);
    }
  };
  // (console.log("id ------>",id,"item------------->",item))
  switch (id) {
    case 1:
      const value = item[0] || 0;
      const isStatus =
        typeof value === 'string' &&
        ['PRESENT', 'LATE', 'ABSENT', 'PERMISSION', 'LEAVE'].includes(
          value.toUpperCase()
        );

      let colorClass = 'text-gray-700 dark:text-slate-300';
      if (isStatus) {
        const upper = value.toUpperCase();
        if (upper === 'PRESENT')
          colorClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
        else if (upper === 'ABSENT')
          colorClass = 'text-red-500 dark:text-red-400 font-bold';
        else if (upper === 'LATE')
          colorClass = 'text-amber-500 dark:text-amber-400 font-bold';
        else if (upper === 'PERMISSION')
          colorClass = 'text-blue-500 dark:text-blue-400 font-bold';
      }

      return (
        <div className="flex w-full justify-between dark:text-slate-300 items-center">
          <p className="font-semibold">{item[0] || '-'}</p>
        </div>
      );
    case 3:
      return (
        <div className="flex w-full justify-start items-center gap-2">
          {item[0] ? (
            <img
              className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
              src={
                item[0].startsWith('http')
                  ? item[0]
                  : item[0].startsWith('/')
                  ? item[0]
                  : `${BASE_URL}${item[0]}`
              }
              alt={item[1]}
              onError={(e) => {
                try {
                  const currentSrc = e.target.getAttribute('src') || '';
                  if (
                    currentSrc &&
                    !currentSrc.startsWith('http') &&
                    !currentSrc.startsWith('data:') &&
                    BASE_URL
                  ) {
                    e.target.onerror = null;
                    const fixed = currentSrc.startsWith('/')
                      ? `${BASE_URL}${currentSrc}`
                      : `${BASE_URL}/${currentSrc}`;
                    e.target.src = fixed;
                    return;
                  }
                } catch (err) {
                  // fall through to hide
                }
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{ display: item[0] ? 'none' : 'flex' }}
            className="rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 h-8 w-8 text-center items-center justify-center font-bold text-xs"
          >
            {(item[1] ?? '')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('') || 'NA'}
          </div>
          <div className="flex flex-col items-start ">
            <p className="font-semibold text-gray-700 dark:text-slate-200 text-sm">
              {item[1] || '-'}
            </p>
            <p className="font-normal text-gray-500 dark:text-slate-400 text-xs">
              {item[2] || '-'}
            </p>
          </div>
        </div>
      );
    case 11:
      return (
        <div className="flex w-full justify-start items-center">
          <p className="font-semibold text-gray-500  text-xs  dark:text-slate-50">
            {item[0] || 'Header'}
          </p>
        </div>
      );
    case 61:
      return (
        <div className="flex w-full justify-center gap-1.5 items-center ">
          <div
            onClick={deleteItem}
            className="p-1.5 bg-red-600 rounded-md hover:bg-red-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Trash'} className="text-slate-50 h-4 w-4" />
          </div>
          <div
            onClick={openModal}
            className="p-1.5 bg-blue-800 rounded-md hover:bg-slate-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Eye'} className="text-slate-50 h-4 w-4" />
            {isModalOpen && (
              <FileDrawer
                transparency={'bg-slate-900/30 dark:bg-slate-900/20'}
                width="w-1/2"
                isModalOpen={isModalOpen}
                closeModal={setModalOpen}
              >
                <Comps payroll={data?.raw || data} data={data} />
                {console.log('data', data)}
              </FileDrawer>
            )}
          </div>
        </div>
      );
    case 62:
      return (
        <div className="flex w-full h-full gap-1.5 items-center ">
          <div
            onClick={deleteItem}
            className="p-1.5 bg-red-600 rounded-md hover:bg-red-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Trash'} className="text-slate-50 h-4 w-4" />
          </div>

          <div
            onClick={openModal}
            className="p-1.5 bg-blue-800 rounded-md hover:bg-slate-900 hover:cursor-pointer h-full *:scrollbar-hidden"
          >
            <Icon name={'Eye'} className="text-slate-50 h-4 w-4" />
            {isModalOpen && (
              <FileDrawer
                transparency={'bg-slate-900/30 dark:bg-slate-900/20 h-full '}
                width="w-1/2 h-full bg-black"
                isModalOpen={isModalOpen}
                closeModal={setModalOpen}
              >
                <DocumentList files={[data]} justOpen={true} />
                {console.log(data.blob, ' id---->', id, ' item---->', item)}
              </FileDrawer>
            )}
          </div>
        </div>
      );
    case 63:
      return (
        <div className="flex w-full justify-start gap-1.5 items-center ">
          <div
            onClick={openModal}
            className=" hover:cursor-pointer *:scrollbar-hidden"
          >
            {/* <Icon name={"Eye"} className="text-slate-50 h-4 w-4"/> */}
            <div>
              <p className="hover:underline text-blue-500 hover:text-blue-700">
                {nickname}
              </p>
            </div>
            {isModalOpen && (
              <FileDrawer
                transparency={'bg-slate-900/30 dark:bg-slate-900/20'}
                width="w-1/2"
                isModalOpen={isModalOpen}
                closeModal={setModalOpen}
              >
                {/* <PayrollReportDrawer data={data}/> */}
                <Comps payroll={data?.raw || data} data={data} />
              </FileDrawer>
            )}
          </div>
        </div>
      );
    case 64:
      return (
        <div className="flex w-full  gap-1.5 items-center ">
          <div
            onClick={deleteItem}
            className="p-1.5 bg-red-600 rounded-md hover:bg-red-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Trash'} className="text-slate-50 h-4 w-4" />
          </div>

          <div
            onClick={openModal}
            className="p-1.5 bg-blue-800 rounded-md hover:bg-slate-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Eye'} className="text-slate-50 h-4 w-4" />
            {isModalOpen && (
              <FileDrawer
                transparency={'bg-slate-900/30 dark:bg-slate-900/20'}
                width="w-1/2"
                isModalOpen={isModalOpen}
                closeModal={setModalOpen}
              >
                <Comps month={D1} demoEmployees={rawData} Id={`${data?.id}`} />
                {/* {console.log("aaaaaaaaaaaaaaaaaaaaaaaa",data[id]?.id)} */}
                {/* {console.log("data in table structure---->",data," id---->",id," item---->",item," rawData---->",rawData,"D1",D1)} */}
              </FileDrawer>
            )}
          </div>
        </div>
      );
    case 65:
      return (
        <div className="flex w-full  gap-1.5 items-center ">
          <div
            onClick={deleteItem}
            className="p-1.5 bg-red-600 rounded-md hover:bg-red-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Trash'} className="text-slate-50 h-4 w-4" />
          </div>

          <div
            onClick={openModal}
            className="p-1.5 bg-blue-800 rounded-md hover:bg-slate-900 hover:cursor-pointer *:scrollbar-hidden"
          >
            <Icon name={'Eye'} className="text-slate-50 h-4 w-4" />
            {isModalOpen && (
              <FileDrawer
                transparency={'bg-slate-900/30 dark:bg-slate-900/20'}
                width="w-1/2"
                isModalOpen={isModalOpen}
                closeModal={setModalOpen}
              >
                <Comps
                  isEditable={true}
                  onSave={(updatedPayroll) => {
                    console.log('Saved:-', updatedPayroll);
                  }}
                  payroll={data?.raw || data}
                  Id={`${data?.id}`}
                />
              </FileDrawer>
            )}
          </div>
        </div>
      );
    case 71:
      return (
        <div className="px-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full = shadow flex items-center justify-center  text-slate-700 font-bold text-xs">
              {item[0]?.charAt(0)}
              {item[0]?.split(' ')[1]?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                {data?.hasIssues && (
                  <span
                    title={data?.issueNotes || 'Calculation issue'}
                    className="cursor-help text-sm"
                  >
                    ⚠️
                  </span>
                )}
                <p className="text-sm font-medium dark:text-slate-100 text-slate-900">
                  {item[0]}
                </p>
              </div>
              <p className="text-xs dark:text-slate-300  text-slate-500">
                {item[1]}
              </p>
            </div>
          </div>
        </div>
      );
    case 72:
      return (
        <div className="px-2 text-xs text-right text-slate-600 font-medium">
          {formatMoney(item[0])}
        </div>
      );
    case 73:
      return (
        <div className="px-2 text-xs text-center">
          <span
            className={`inline-flex shadow items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item[0] < 22
                ? 'bg-amber-100 text-amber-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {item[0]} days
          </span>
        </div>
      );
    case 74: {
      const amount = Number(item[0]) || 0;
      return (
        <div className="px-2 text-xs text-right">
          {amount !== 0 ? (
            <span className="text-red-600 font-medium">
              -{formatMoney(Math.abs(amount))}
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </div>
      );
    }
    case 75: {
      const amount = Number(item[0]) || 0;
      const isCredit = amount < 0;
      const isDebit = amount > 0;
      return (
        <div className="px-2 text-xs text-right">
          {isCredit ? (
            <div className="flex flex-col items-end text-emerald-600 font-medium">
              <span>+{formatMoney(Math.abs(amount))}</span>
              <span className="text-[10px] text-emerald-500">credit</span>
            </div>
          ) : isDebit ? (
            <div className="flex flex-col items-end text-red-600 font-medium">
              <span>-{formatMoney(Math.abs(amount))}</span>
              <span className="text-[10px] text-red-500">carryover</span>
            </div>
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </div>
      );
    }
    case 76:
      return (
        <div className="px-2 text-xs text-right text-slate-600">
          {formatMoney(item[0])}
        </div>
      );
    case 77:
      return (
        <div className="px-2 text-xs text-right font-bold text-slate-800 bg-slate-50/50 group-hover:bg-slate-100/50">
          {formatMoney(item[0])}
        </div>
      );
    case 78:
      return (
        <div className="px-2 text-xs  text-start">
          {D1 === 'draft' ? (
            <button
              className="text-slate-600  shadow-xs hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
              onClick={openModal}
            >
              {' '}
              Edit
              {isModalOpen && (
                <FileDrawer
                  transparency={'bg-slate-900/30 dark:bg-slate-900/20'}
                  width="w-1/2"
                  isModalOpen={isModalOpen}
                  closeModal={setModalOpen}
                >
                  <Comps editable={true} payroll={data?.raw || data} />
                  {/* <Comps month={D2} demoEmployees={rawData} Id={`${data?.id}`}/> */}
                  {/* {console.log("aaaaaaaaaaaaaaaaaaaaaaaa",data[id]?.id)} */}
                  {/* {console.log("data in table structure---->",data," id---->",id," item---->",item," rawData---->",rawData,"D1",D1)} */}
                </FileDrawer>
              )}
            </button>
          ) : (
            <button
              // onClick={() => setSelectedEmployee(emp)}
              className=" text-yellow-800 shadow-xs hover:bg-indigo-50 p-2 rounded-lg transition-colors"
              onClick={openModal}
            >
              {' '}
              View
              {isModalOpen && (
                <FileDrawer
                  transparency={'bg-slate-900/30 dark:bg-slate-900/20'}
                  width="w-1/2"
                  isModalOpen={isModalOpen}
                  closeModal={setModalOpen}
                >
                  <Comps payroll={data?.raw || data} />
                  {console.log("i'm here just to check my own payslip")}
                  {/* {console.log("aaaaaaaaaaaaaaaaaaaaaaaa",data[id]?.id)} */}
                  {/* {console.log("data in table structure---->",data," id---->",id," item---->",item," rawData---->",rawData,"D1",D1)} */}
                </FileDrawer>
              )}
            </button>
          )}
          {['draft', 'generated', 'rolled_back'].includes(D1) &&
            data?.payslipId && (
              <button
                className="ml-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                onClick={async () => {
                  const targetId = data?.payslipId ?? item?.[0];
                  if (!targetId) {
                    window.alert('No payslip id found for this row');
                    return;
                  }
                  const raw = window.prompt(
                    'Enter adjustment for next payroll (positive = deduction, negative = credit):',
                    '0'
                  );
                  if (raw === null) return;
                  const val = Number(raw);
                  if (!Number.isFinite(val)) {
                    window.alert('Invalid number');
                    return;
                  }
                  try {
                    console.log('Set Adj call', {
                      targetId,
                      baseURL: axiosPrivate?.defaults?.baseURL,
                    });
                    await axiosPrivate.post(
                      `/payroll/payslips/${targetId}/set-adjustment/`,
                      {
                        adjustment: val,
                      }
                    );
                    window.alert('Adjustment saved for next payroll');
                  } catch (err) {
                    const msg =
                      err?.response?.data?.error ||
                      err?.message ||
                      'Failed to set adjustment';
                    console.error('set-adjustment failed', err);
                    window.alert(msg);
                  }
                }}
              >
                Set Adj
              </button>
            )}
        </div>
      );
    case 771:
      return (
        <div className="px-2 text-xs dark:text-slate-50 text-start font-semibold">
          {item[0] || '-'}
        </div>
      );
    case 772:
      return (
        <div className="px-2 text-xs dark:text-slate-50 font-semibold text-right">
          {item[0] || '-'}
        </div>
      );
    case 773:
      return (
        <div className="px-2 text-xs dark:text-slate-50 font-semibold text-right text-red-600">
          {item[0] || '-'}
        </div>
      );
    case 774:
      return (
        <div className="px-2 text-xs dark:text-slate-50 font-semibold text-right text-emerald-600">
          {item[0] || '-'}
        </div>
      );
    case 775:
      return (
        <div className="px-2 text-xs font-semibold dark:text-slate-50 text-right">
          {item[0] || '-'}
        </div>
      );
    case 776:
      return (
        <div className="px-2 text-xs dark:text-slate-50 font-semibold text-right">
          {item[0] || '-'}
        </div>
      );
    case 777:
      return (
        <div className="px-2 text-xs dark:text-slate-50 font-semibold text-right">
          {item[0] || '-'}
        </div>
      );

    case 81:
      const dateVal = item[0]
        ? new Date(item[0]).toISOString().split('T')[0]
        : '-';
      return (
        <div className="flex w-full justify-start items-center dark:text-slate-300">
          <p className="font-semibold text-xs">{dateVal}</p>
        </div>
      );
    case 82:
      const fullFilename = item[0] || '';
      const fParts = fullFilename.split('.');
      const fExtension = fParts.length > 1 ? `.${fParts.pop()}` : '';
      const fBaseName = fParts.join('.');
      const fWords = fBaseName.split(/[\s_]+/).filter(Boolean);
      const displayShortName =
        fWords.length > 2
          ? fWords.slice(0, 2).join(' ') + '...' + fExtension
          : fullFilename;

      return (
        <div className="flex w-full justify-start items-center dark:text-slate-300">
          <p className="font-semibold text-sm" title={fullFilename}>
            {displayShortName}
          </p>
        </div>
      );
    case 83:
      const fullNotes = item[0] || '';
      const nWords = fullNotes.split(/\s+/).filter(Boolean);
      const displayShortNotes =
        nWords.length > 2 ? nWords.slice(0, 2).join(' ') + '...' : fullNotes;
      return (
        <div className="flex w-full justify-start items-center dark:text-slate-300">
          <p className="text-xs" title={fullNotes}>
            {displayShortNotes || '-'}
          </p>
        </div>
      );
    default:
      return <p>-</p>;
  }
}

export default TableStructures;
