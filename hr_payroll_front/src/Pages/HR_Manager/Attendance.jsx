import { useRef, useState } from 'react';
import Dropdowns from '../../Components/Dropdowns';

export default function Attendance() {
  const fruit = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [isOpen, setOpen] = useState(false);
  const dref = useRef(null);
  const table_header = (
    <thead className={`bg-slate-100   dark:bg-slate-600 rounded-xl`}>
      <tr className="justify-evenly  ">
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Date
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Clock in
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Clock inLocation
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Clock Out
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Clock Out Location
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Work Schedule
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Logged Time
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Paid Time
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
        <th className=" px-4 py-3">
          <div className="flex w-full justify-between items-center ">
            <p
              className={`font-semibold text-gray-500  dark:text-slate-300  text-xs`}
            >
              Default
            </p>
            <img
              className="h-5 opacity-25"
              src="\svg\down-arrow-5-svgrepo-com.svg"
              alt=""
            />
          </div>
        </th>
      </tr>
    </thead>
  );
  const table_content = (
    <tbody>
      {fruit.map((fruit) => (
        <tr
          className={`hover:bg-slate-50 font-semibold text-sm text-gray-700  dark:text-slate-400 dark:hover:bg-slate-700`}
        >
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            01 Mar 2025
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            08:00(GMT+7)
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2  dark:border-slate-700`}
          >
            <div className="flex w-full justify-between items-center ">
              <p className="font-semibold">Mexico</p>
              <img className="h-4 opacity-25" src="\svg\location.svg" alt="" />
            </div>
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            14:30(GMT+7)
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2  dark:border-slate-700`}
          >
            <div className="flex w-full justify-between items-center ">
              <p className="font-semibold">Mexico</p>
              <img className="h-4 opacity-25" src="\svg\location.svg" alt="" />
            </div>
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            8hr
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            8hr30m
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            8hr
          </td>
          <td
            className={`border-b border-gray-100 px-4 py-2   dark:border-slate-700`}
          >
            +30m
          </td>
        </tr>
      ))}
    </tbody>
  );
  const pagination = (
    <div id="middle" className="flex flex-1 justify-between  items-start ">
      <div className="flex items-center  gap-1.5">
        <div
          className={` dark:border-slate-700 py-1.5 px-1 border-gray-100 shadow-2xl border h-full`}
        >
          <img className="h-3" src="\svg\left-chevron-svgrepo-com.svg" alt="" />
        </div>
        <p
          className={`  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs`}
        >
          1
        </p>
        <p
          className={`  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-500  text-xs items-center`}
        >
          ...
        </p>
        <p
          className={`  dark:border-slate-700 dark:text-slate-300 font-semibold py-1 px-2 border-gray-100 shadow-2xl border text-gray-700  text-xs`}
        >
          2
        </p>
        <div
          className={`  dark:border-slate-700 dark:text-slate-300 py-1.5 px-1 border-gray-100 shadow-2xl border h-full`}
        >
          <img
            className="h-3 rotate-180"
            src="\svg\left-chevron-svgrepo-com.svg"
            alt=""
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <p
          className={` dark:text-slate-300 font-semibold text-gray-500  text-xs`}
        >
          Showing 1 to 8 of 8 entries
        </p>
        <div
          className={` dark:border-slate-700 flex items-center py-1.5 px-2 border border-gray-100 rounded`}
        >
          <p
            className={` dark:text-slate-300 font-semibold text-gray-700  text-xs`}
          >
            Show 8
          </p>
          <img
            className="h-4 rotate-180"
            src="\svg\down-arrow-5-svgrepo-com.svg"
            alt=""
          />
        </div>
      </div>
    </div>
  );
  const left = (
    <div
      id="left"
      className="flex py-2.5 flex-2 gap-3  justify-between items-center  "
    >
      <div
        className={`flex  dark:text-slate-300 dark:border-slate-700 flex-1  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <p className="text-xs font-semibold">01 Jan 2023 - 10 Mar 2023</p>
        <img className="h-4" src="\svg\date-2-svgrepo-com.svg" alt="" />
      </div>
      <div
        className={`flex  dark:text-slate-300 dark:border-slate-700  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <p className="text-xs font-semibold">All Record</p>
        <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
      </div>
      <div
        className={`flex  dark:text-slate-300 dark:border-slate-700  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <p className="text-xs font-semibold">All Location</p>
        <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
      </div>
      <div
        ref={dref}
        className={`flex dark:text-slate-300 dark:border-slate-700  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <div
          onClick={() => setOpen((set) => !set)}
          className="text-xs cursor-pointer  font-semibold"
        >
          All Status
        </div>
        <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
        {isOpen && (
          <Dropdowns
            targetRef={dref}
            onClose={() => setOpen(false)}
          ></Dropdowns>
        )}
      </div>
    </div>
  );
  const List = (
    <div
      id="left"
      className="flex py-2.5 flex-2 gap-3  justify-between items-center  "
    >
      <div
        className={`flex  dark:bg-slate-800 bg-white shadow flex-1 flex-col dark:text-slate-300 text-gray-700 border dark:border-slate-700 border-gray-100 items-start  justify-start gap-5 px-5 py-4 rounded-md `}
      >
        <div className="flex  w-full justify-between ">
          <p className="text-md font-bold">Work Schedule</p>
          <img
            className="h-4 opacity-15 "
            src="\svg\date-2-svgrepo-com.svg"
            alt=""
          />
        </div>
        <p className="text-xs font-normal">48 Hours</p>
      </div>
      <div
        className={`flex  dark:bg-slate-800 bg-white shadow flex-1 flex-col dark:text-slate-300 text-gray-700 border dark:border-slate-700 border-gray-100 items-start  justify-start gap-5 px-5 py-4 rounded-md `}
      >
        <div className="flex  w-full justify-between ">
          <p className="text-md font-bold">Work Schedule</p>
          <img
            className="h-4 opacity-15 "
            src="\svg\date-2-svgrepo-com.svg"
            alt=""
          />
        </div>
        <p className="text-xs font-normal">48 Hours</p>
      </div>
      <div
        className={`flex  dark:bg-slate-800 bg-white shadow flex-1 flex-col dark:text-slate-300 text-gray-700 border dark:border-slate-700 border-gray-100 items-start  justify-start gap-5 px-5 py-4 rounded-md `}
      >
        <div className="flex  w-full justify-between ">
          <p className="text-md font-bold">Work Schedule</p>
          <img
            className="h-4 opacity-15 "
            src="\svg\date-2-svgrepo-com.svg"
            alt=""
          />
        </div>
        <p className="text-xs font-normal">48 Hours</p>
      </div>
      <div
        className={`flex  dark:bg-slate-800 bg-white shadow flex-1 flex-col dark:text-slate-300 text-gray-700 border dark:border-slate-700 border-gray-100 items-start  justify-start gap-5 px-5 py-4 rounded-md `}
      >
        <div className="flex  w-full justify-between ">
          <p className="text-md font-bold">Work Schedule</p>
          <img
            className="h-4 opacity-15 "
            src="\svg\date-2-svgrepo-com.svg"
            alt=""
          />
        </div>
        <p className="text-xs font-normal">48 Hours</p>
      </div>
    </div>
  );
  const Header = (
    <div
      id="left"
      className="flex py-2.5 flex-2 gap-3  justify-between items-center  "
    >
      <div
        className={`flex flex-1 flex-col  dark:text-slate-300 text-gray-700 items-start  justify-start  rounded-md`}
      >
        <p className="text-xl font-bold">My Attendance</p>
        <p className={`text-xs text-gray-500 font-semibold`}>
          Manage Your Attendance
        </p>
      </div>
      <div
        className={`flex bg-slate-800 text-white items-center  justify-center gap-1.5 px-5 py-3 rounded-md`}
      >
        <img className="h-4" src="\svg\clock.svg" alt="" />
        <p className="text-xs font-semibold">Check in 00h 00m 05s</p>
      </div>
    </div>
  );
  const warning = (
    <div
      id="left"
      className="flex flex-2 gap-3  justify-between items-center  "
    >
      <div
        className={`flex flex-1   dark:bg-blue-300 dark:text-slate-700 bg-sky-50 text-sky-800 items-center  justify-start gap-1.5 px-5  rounded-md`}
      >
        <img className="h-8 " src="\svg\warning-alt-svgrepo-com.svg" alt="" />
        <p className="text-xs font-normal">
          You can only update the attendance record within the last 31 days
        </p>
      </div>
    </div>
  );
  return (
    <div
      className={`  dark:bg-slate-900 flex flex-col w-full h-full bg-gray-50 `}
    >
      <div className=" flex justify-evenly  gap-3 ">{Header}</div>
      <div className=" flex justify-evenly  gap-3 ">{List}</div>
      <div
        className={`flex flex-1 shadow overflow-scroll   dark:bg-slate-800 bg-white flex-col p-4 rounded-md`}
      >
        <div className=" flex justify-evenly h-14 gap-3 ">{warning}</div>
        <div className=" flex justify-evenly h-14 gap-3 ">{left}</div>
        <div className=" flex-1   overflow-y-scroll scrollbar-hidden">
          <table
            className={`table-auto w-full   dark:border-slate-700 border-b border-gray-300 `}
          >
            {table_header}
            {table_content}
          </table>
        </div>
        <div className=" flex justify-evenly my-2.5 h-14 gap-3 ">
          {pagination}
        </div>
      </div>
    </div>
  );
}
