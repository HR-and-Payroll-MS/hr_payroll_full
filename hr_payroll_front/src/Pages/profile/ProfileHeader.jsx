// import ProfilePicture from "./ProfilePicture";
// import Icon from '../../Components/Icon'

//  export default function ProfileHeader({ employeeData, setEmployeeData }) {
//   const general = employeeData?.general || {};
//   const job = employeeData?.job || {};

//   return (
//     <div className="w-full bg-white rounded-md  pb-4  overflow-hidden">
//       <div className="h-34 bg-cover bg-center" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d')" }} />
//       <div className="relative px-6 -mt-14">
//         <ProfilePicture 
//            currentPhoto={general?.profilepicture} 
//            setEmployeeData={setEmployeeData} 
//          />
//         <div className="flex justify-between">
//           <div className="mt-4">
//             <h2 className="text-xl font-semibold">Kumaran Selvam</h2>
//             <p className="text-gray-600 text-sm">UI/UX Designer • India</p>
//           </div>
          
//             <div id="middle" className="items-center justify-baseline flex flex-col flex-1">
//               <div className="flex items-start gap-2 justify-start p-1 rounded hover:bg-slate-50">
//                 <Icon className='w-4 h-4' name={'Mail'}/>
//                 <p className="font-semibold text-xs text-gray-700 rounded-md">
//                   {employeeData?.general?.emailaddress || "No email"}
//                 </p>
//               </div>
        
//               <div className="flex items-start gap-2 justify-start p-1 rounded hover:bg-slate-50">
//                 <Icon className='w-4 h-4' name={'Phone'}/>
//                 <p className="font-semibold text-xs text-gray-700 rounded-md">
//                   {employeeData?.general?.phonenumber || "0972334145"}
//                 </p>
//               </div>
        
//               <div className="flex items-start gap-2 justify-start p-1 rounded hover:bg-slate-50">
//                 <Icon className='w-4 h-4' name={'MapPinned'}/>
//                 <p className="font-semibold text-xs text-gray-700 rounded-md">
//                   {employeeData?.general?.timezone || "GMT+07:00"}
//                 </p>
//               </div>
//             </div>
//             <div id="bottom" className="flex-2 flex items-end justify-between">
//               <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
//                 <div>
//                   <p className="font-semibold text-gray-400 text-xs">Department</p>
//                   <p className="font-bold text-gray-700 text-xs">
//                     {employeeData?.job?.department || "Designer"}
//                   </p>
//                 </div>
//               </div>
        
//               <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
//                 <div>
//                   <p className="font-semibold text-gray-400 text-xs">Office</p>
//                   <p className="font-bold text-gray-700 text-xs">
//                     {employeeData?.job?.office || "Unpixel Studio"}
//                   </p>
//                 </div>
//               </div>
        
//               <div className="flex items-center gap-1.5 justify-between p-2 rounded hover:bg-slate-50">
//                 <div>
//                   <p className="font-semibold text-gray-400 text-xs">Line Manager</p>
//                   <div className="flex items-center gap-1.5 my-1.5">
//                   <img
//                   className="w-6 h-6 object-fill rounded-full"
//                   src={employeeData?.general?.profilepicture || "\\pic\\download (48).png"}
//                   alt="Profile"
//                 />
//                     <p className="font-bold text-gray-700 text-xs">
//                       {employeeData?.job?.linemanager || "Skylar Catzoni"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//         </div>
//       </div>
//     </div>

//   );
// }


import ProfilePicture from "./ProfilePicture";
import Icon from '../../Components/Icon'

export default function ProfileHeader({ employeeData, setEmployeeData }) {
  const general = employeeData?.general || {};
  const job = employeeData?.job || {};
  console.log(employeeData,"employeeData",general,"general", job,"job")
  return (
  <div className="w-full bg-white dark:bg-slate-700 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 overflow-hidden transition-colors">
    {/* BANNER SECTION */}
    <div 
      className="h-32 bg-cover bg-center opacity-90 dark:opacity-80" 
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d')" }} 
    />
    
    <div className="relative px-6 -mt-12 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        
        {/* LEFT: PROFILE PIC & PRIMARY INFO */}
        <div className="flex items-center gap-4">
          <ProfilePicture 
            currentPhoto={general?.photo} 
            userName={general?.fullname}
            setEmployeeData={setEmployeeData}
            // Ensure ProfilePicture internal styles use a thick border to pop against the banner
            className="border-4 border-white dark:border-slate-700 shadow-md"
          />
          <div className="mt-10 md:mt-12">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {general?.fullname || "Kumaran Selvam"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {job?.jobtitle || "UI/UX Designer"} • {general?.country || "India"}
            </p>
          </div>
        </div>

        {/* MIDDLE: CONTACT INFO - Styled like your Attendance list items */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-6 mt-4 md:mt-12">
          {[
            { icon: 'Mail', value: general?.emailaddress || "No email" },
            { icon: 'Phone', value: general?.phonenumber || "0972334145" },
            { icon: 'MapPinned', value: general?.timezone || "GMT+07:00" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-600/50 transition-colors">
              <Icon className='w-4 h-4 text-slate-400 dark:text-slate-500' name={item.icon}/>
              <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM: STATS BAR - Matches your "STATS ROW" from the Attendance component */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-600/50">
        {[
          { label: "Department", value: job?.department || "Designer" },
          { label: "Office", value: job?.office || "Unpixel Studio" },
          { 
            label: "Line Manager", 
            value: job?.linemanager || "Skylar Catzoni", 
            img: job?.manager_photo || "/pic/download (48).png" 
          }
        ].map((stat, i) => (
          <div key={i} className="flex flex-col">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
              {stat.label}
            </p>
            <div className="flex items-center gap-2">
              {stat.img && (
                <img src={stat.img} className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-500" alt="mgr" />
              )}
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
}