import React, { useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import { getScanGraph } from "../../services/api";

// Demo Data (Only shown if NO job ID is provided)
const demoNodes: Node[] = [
  { id: "internet", position: { x: 300, y: 20 }, data: { label: "Internet", node_type: "Asset" }, type: "input", style: { background: "#2563eb", color: "white" } },
  { id: "demo-web", position: { x: 300, y: 150 }, data: { label: "Demo Web Server", node_type: "Asset" }, type: "default", style: { background: "#16a34a", color: "white" } }
];
const demoEdges: Edge[] = [{ id: "e1-demo", source: "internet", target: "demo-web", animated: true }];

interface Props {
  initialJobId?: string;
  onNodeClick?: (node: any) => void; // New Prop
}

const AttackGraph = ({ initialJobId, onNodeClick }: Props) => {
  // Use React Flow hooks for state management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string>(initialJobId || "");
  const [error, setError] = useState<string | null>(null);

  const fetchGraphData = async (id: string) => {
    if (!id) return;
    
    console.log(`Fetching graph for Job ID: ${id}`);
    setLoading(true);
    setError(null);
    
    try {
      const graphData = await getScanGraph(id);
      
      if (graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.edges)) {
        if (graphData.nodes.length === 0) {
          setError("No attack path data found for this scan.");
          setNodes([]);
          setEdges([]);
        } else {
          setNodes(graphData.nodes);
          setEdges(graphData.edges);
        }
      } else {
        console.error("Invalid graph format:", graphData);
        setError("Received invalid graph data format from server.");
      }
    } catch (err) {
      console.error("Failed to fetch graph:", err);
      setError("Failed to load graph data.");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount or ID change
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      fetchGraphData(initialJobId);
    } else {
      setNodes(demoNodes);
      setEdges(demoEdges);
    }
  }, [initialJobId]);

  return (
    <>
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          onNodeClick={(_, node) => {
            // Notify parent instead of handling drawer internally
            if (onNodeClick) onNodeClick(node);
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
        
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
            <p className="font-bold text-lg">Generating Attack Graph...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AttackGraph;
