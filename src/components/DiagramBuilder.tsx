import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Node,
  NodeTypes,
  ReactFlowInstance,
  addEdge,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useToast } from '@/hooks/use-toast';
import { K8sNodeData, K8sNodeType, defaultNodeData } from '@/types/k8s';
import { hasExistingConnection, validateConnection } from '@/utils/connectionRules';
import { clearDiagramState, createAutoSave, loadDiagramState, saveDiagramState } from '@/utils/diagramStorage';
import { DiagramTemplate, templates } from '@/utils/templates';
import { generateYamlFromGraph } from '@/utils/yamlGenerator';
import {
  ChevronDown,
  Github,
  LayoutTemplate,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import K8sNode from './k8s/K8sNode';
import NodePalette from './k8s/NodePalette';
import PropertiesPanel from './k8s/PropertiesPanel';
import YamlPanel from './k8s/YamlPanel';

const nodeTypes: NodeTypes = {
  k8sNode: K8sNode,
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export default function DiagramBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<K8sNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<K8sNodeData> | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  // Load saved diagram on mount
  useEffect(() => {
    const savedState = loadDiagramState();
    if (savedState && savedState.nodes.length > 0) {
      setNodes(savedState.nodes);
      setEdges(savedState.edges);

      // Update nodeId counter to avoid conflicts
      const maxId = savedState.nodes.reduce((max, node) => {
        const id = parseInt(node.id.replace('node_', ''));
        return isNaN(id) ? max : Math.max(max, id);
      }, 0);
      nodeId = maxId + 1;

      toast({
        title: "Diagram restored",
        description: "Your previous diagram has been loaded",
      });
    }
    setIsLoaded(true);
  }, []);

  // Auto-save diagram when nodes or edges change
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load

    const autoSave = createAutoSave((nodes, edges) => {
      saveDiagramState(nodes, edges);
      setLastSaved(new Date());
    });

    autoSave(nodes, edges);
  }, [nodes, edges, isLoaded]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Find source and target nodes
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      // Check if connection already exists
      if (hasExistingConnection(params.source!, params.target!, edges)) {
        toast({
          title: "Connection already exists",
          description: "This connection already exists between these nodes",
          variant: "destructive",
        });
        return;
      }

      // Validate connection based on K8s rules
      const validation = validateConnection(sourceNode, targetNode);

      if (!validation.valid) {
        toast({
          title: "Invalid connection",
          description: validation.message || "This connection is not allowed in Kubernetes architecture",
          variant: "destructive",
        });
        return;
      }

      // Connection is valid, add it
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));

      // Show success feedback
      toast({
        title: "Connection created",
        description: `Connected ${(sourceNode?.data as any)?.label} to ${(targetNode?.data as any)?.label}`,
      });
    },
    [nodes, edges, setEdges, toast]
  );

  const onDragStart = useCallback((event: React.DragEvent, nodeType: K8sNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as K8sNodeType;
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node<K8sNodeData> = {
        id: getNodeId(),
        type: 'k8sNode',
        position,
        data: defaultNodeData[type](),
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<K8sNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: Partial<K8sNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } as K8sNodeData };
        }
        return node;
      })
    );
    setSelectedNode((prev) => {
      if (prev && prev.id === nodeId) {
        return { ...prev, data: { ...prev.data, ...data } as K8sNodeData };
      }
      return prev;
    });
  }, [setNodes]);

  const loadTemplate = useCallback((template: DiagramTemplate) => {
    nodeId = template.nodes.length + 1;
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNode(null);
    setShowTemplates(false);
  }, [setNodes, setEdges]);

  const clearDiagram = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    nodeId = 0;
    clearDiagramState();
    toast({
      title: "Diagram cleared",
      description: "Canvas and saved data have been cleared",
    });
  }, [setNodes, setEdges, toast]);

  const generatedYamls = useMemo(() => {
    return generateYamlFromGraph(nodes, edges);
  }, [nodes, edges]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="K8s Diagram Builder Logo" className="h-36" />
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <button onClick={clearDiagram} className="btn-ghost">
              <Plus className="w-4 h-4" />
              New
            </button>
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="btn-ghost"
              >
                <LayoutTemplate className="w-4 h-4" />
                Templates
                <ChevronDown className="w-3 h-3" />
              </button>
              {showTemplates && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-xl z-50 animate-fade-in">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className="w-full px-4 py-3 text-left hover:bg-secondary/50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={clearDiagram} className="btn-ghost text-destructive">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="w-3 h-3 text-green-500" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            <Github className="w-4 h-4" />
          </a>
          <span className="text-xs text-muted-foreground">v1.0.0</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Node Palette */}
        <aside className="w-52 border-r border-border flex-shrink-0">
          <NodePalette onDragStart={onDragStart} />
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 min-w-0" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{ animated: true }}
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
          </ReactFlow>
        </main>

        {/* Right Sidebar - Properties + YAML */}
        <aside className="w-96 border-l border-border flex-shrink-0 flex flex-col">
          {/* Properties Panel */}
          <div className="h-1/2 border-b border-border overflow-hidden">
            <PropertiesPanel
              node={selectedNode}
              onUpdate={updateNodeData}
              onClose={() => setSelectedNode(null)}
            />
          </div>
          {/* YAML Panel */}
          <div className="h-1/2 overflow-hidden">
            <YamlPanel yamls={generatedYamls} />
          </div>
        </aside>
      </div>
    </div>
  );
}
