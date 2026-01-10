// src/components/org-chart/CustomNodeCard.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { PlusCircle, Trash2, Edit2, User } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_BASE_URL;
// {item[0]?(
//               <img className="h-6 w-6 rounded-full" 
//               src={`${BASE_URL}${item[0]}`}
  
//               alt=""
//             />):(
            

const CustomNodeCard = ({ data, id }) => {
  const { isRoot, canEdit } = data; // canEdit passed from parent based on User Role

  return (
    <div className="relative group">
      {!isRoot && <Handle type="target" position={Position.Top} className="!bg-gray-300" />}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-300" />

      <div className="w-[200px] bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center text-center hover:shadow-md transition-all">
        <div className="w-16 h-16 mb-3 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
          {data.image ? <img src={data.image.startsWith('http') || data.image.startsWith('blob') ? data.image : `${BASE_URL}${data.image}`} className="w-full h-full object-cover" /> :             <div className='rounded-full w-full h-full bg-slate-800 dark:bg-slate-600 text-slate-100 text-center items-center flex justify-center' >
                  {data.name
                    .split(" ")
                    .map(n => n[0])
                    .slice(0, 2)
                    .join("") || "NA"}
                            
              </div>}
        </div>
        <h3 className="font-semibold text-gray-800 text-sm truncate w-full">{data.name}</h3>
        <p className="text-xs text-gray-500 truncate w-full">{data.role}</p>
        <span className="mt-2 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{data.department}</span>

        {/* Action Controls - Hidden if canEdit is false */}
        {canEdit && (
          <div className="absolute -bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => data.onAddChild(id)} className="bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 shadow-sm"><PlusCircle size={14} /></button>
            <button onClick={() => data.onEdit(id, data)} className="bg-orange-500 text-white p-1.5 rounded-full hover:bg-orange-600 shadow-sm"><Edit2 size={14} /></button>
            <button onClick={() => data.onDelete(id)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-sm"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNodeCard);