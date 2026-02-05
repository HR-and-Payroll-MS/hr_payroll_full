import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Background,
  Panel, 
  useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import CustomNodeCard from './CustomNodeCard';
import NodeModal from './NewModal';
import { getLayoutedElements } from './chartUtils';
import { Maximize, Lock, Unlock, Zap, Save, Plus, Minus } from 'lucide-react';

const nodeTypes = { orgCard: CustomNodeCard };

const OrgChartEditor = ({ initialData, userRole, onSave }) => {
  const canEdit = userRole === 'Manager' || userRole === 'Payroll';
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLocked, setIsLocked] = useState(false);
  
  // This hook now works because of the Provider in OrgChartPage
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [modalState, setModalState] = useState({ 
    isOpen: false, mode: 'add', targetId: null, initialData: null 
  });

  // --- ACTIONS ---
  const onAddClick = useCallback((parentId) => {
    setModalState({ isOpen: true, mode: 'add', targetId: parentId, initialData: null });
  }, []);

  const onEditClick = useCallback((nodeId, currentData) => {
    setModalState({ isOpen: true, mode: 'edit', targetId: nodeId, initialData: currentData });
  }, []);

  const handleDelete = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  // --- AUTO ALIGN ---
  const onAutoAlign = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'TB');
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    // Small timeout to allow state to settle before fitting view
    setTimeout(() => fitView({ duration: 800 }), 100);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // --- SAVE & LOG ---
  const handleSave = () => {
    const dataToSave = {
      nodes: nodes.map(({ data, ...rest }) => {
        // Log image data for debugging and Strip BASE_URL
        let cleanImage = data.image;
        const BASE_URL = import.meta.env.VITE_BASE_URL || "";
        
        if (cleanImage && BASE_URL && cleanImage.startsWith(BASE_URL)) {
             cleanImage = cleanImage.replace(BASE_URL, "");
             console.log("Stripped BASE_URL:", data.image, "->", cleanImage);
        }

        return {
          ...rest,
          data: {
            name: data.name,
            role: data.role,
            department: data.department,
            image: cleanImage, 
            isRoot: data.isRoot
          }
        };
      }),
      edges: edges
    };

    console.log("%c [BACKEND PAYLOAD PREVIEW]", "color: #22c55e; font-weight: bold; font-size: 14px;");
    console.log(JSON.stringify(dataToSave, null, 2)); // improved logging
    
    // Call onSave prop if provided (for backend integration)
    if (typeof onSave === 'function') {
      onSave(dataToSave);
    } else {
      alert("Data logged to console! Press F12 to inspect the JSON structure.");
    }
  };

  // Initial Sync
  useEffect(() => {
    if (!initialData || !initialData.nodes) return;
    console.log("OrgChartEditor: Initial Data Loaded", initialData.nodes); // debug log
    
    const preparedNodes = initialData.nodes.map(n => ({
      ...n,
      data: { ...n.data, canEdit, onAddChild: onAddClick, onEdit: onEditClick, onDelete: handleDelete }
    }));
    setNodes(preparedNodes);
    setEdges(initialData.edges || []);
  }, [initialData, canEdit, onAddClick, onEditClick, handleDelete, setNodes, setEdges]);

  const handleModalSubmit = (formData) => {
    if (modalState.mode === 'add') {
      const newNodeId = uuidv4();
      const newNode = {
        id: newNodeId,
        type: 'orgCard',
        data: { ...formData, canEdit, onAddChild: onAddClick, onEdit: onEditClick, onDelete: handleDelete },
        position: { x: Math.random() * 100, y: Math.random() * 100 },
      };
      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => addEdge({ id: uuidv4(), source: modalState.targetId, target: newNodeId, type: 'smoothstep' }, eds));
    } else {
      setNodes((nds) => nds.map((n) => n.id === modalState.targetId ? { ...n, data: { ...n.data, ...formData } } : n));
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="h-full w-full bg-slate-50 rounded-2xl relative shadow-inner overflow-hidden border border-slate-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={!isLocked && canEdit}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
      >
        <Background variant="dots" color="#cbd5e1" gap={20} />
        
        {/* TOP RIGHT PANEL: SAVE */}
        {canEdit && (
          <Panel position="top-right">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Save size={18} />
              Save Chart
            </button>
          </Panel>
        )}

        {/* BOTTOM LEFT PANEL: CONTROLS */}
        <Panel position="bottom-left" className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white flex flex-col gap-1 mb-4 ml-4">
          <button onClick={() => zoomIn()} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Zoom In">
            <Plus size={18} />
          </button>
          <button onClick={() => zoomOut()} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Zoom Out">
            <Minus size={18} />
          </button>
          <button onClick={() => fitView({ duration: 800 })} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Fit View">
            <Maximize size={18} />
          </button>
          
          <div className="h-px bg-slate-200 mx-2 my-1" />
          
          <button 
            onClick={onAutoAlign} 
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
            title="Auto Align (Magic)"
          >
            <Zap size={18} fill="currentColor" />
          </button>
          
          <button 
            onClick={() => setIsLocked(!isLocked)} 
            className={`p-2 rounded-xl transition-all ${isLocked ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-600'}`}
            title={isLocked ? "Unlock View" : "Lock View"}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        </Panel>
      </ReactFlow>

      <NodeModal 
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default OrgChartEditor;