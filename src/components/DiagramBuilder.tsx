import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TemplateItem } from '@/types/template';
import { hasExistingConnection, validateConnection } from '@/utils/connectionRules';
import { clearDiagramState, createAutoSave, loadDiagramState, saveDiagramState } from '@/utils/diagramStorage';
import { DiagramTemplate } from '@/utils/templates';
import { generateYamlFromGraph } from '@/utils/yamlGenerator';
import { fetchTemplateYaml, parseYamlToGraph } from '@/utils/yamlParser';
import {
  Code,
  Github,
  GraduationCap,
  Menu,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
  Upload
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
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<K8sNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<K8sNodeData> | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
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

  // Mobile: Add node to center of viewport on tap
  const addNodeToCanvas = useCallback((nodeType: K8sNodeType) => {
    if (!reactFlowInstance) return;

    // Get the center of the current viewport
    const viewport = reactFlowInstance.getViewport();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

    const newNode: Node<K8sNodeData> = {
      id: getNodeId(),
      type: 'k8sNode',
      position: { x: centerX - 90, y: centerY - 60 }, // Offset to center the node
      data: defaultNodeData[nodeType](),
    };

    setNodes((nds) => [...nds, newNode]);

    // Close mobile palette after adding
    setShowPalette(false);

    toast({
      title: "Node added",
      description: `${newNode.data.label} added to canvas. Drag to reposition.`,
    });
  }, [reactFlowInstance, setNodes, toast]);

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

  const handleTemplateSelect = useCallback(async (template: TemplateItem) => {
    try {
      const { nodes: templateNodes, edges: templateEdges } = await fetchTemplateYaml(template.path);

      // Update nodeId counter to avoid conflicts
      const maxId = templateNodes.reduce((max, node) => {
        const id = parseInt(node.id.replace('node_', ''));
        return isNaN(id) ? max : Math.max(max, id);
      }, nodeId);
      nodeId = maxId + 1;

      setNodes(templateNodes);
      setEdges(templateEdges);
      setSelectedNode(null);
      setShowPalette(false); // Close mobile palette after loading template

      toast({
        title: "Template loaded",
        description: `${template.title} has been loaded to the canvas`,
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Failed to load template",
        description: error instanceof Error ? error.message : "An error occurred while loading the template",
        variant: "destructive",
      });
    }
  }, [setNodes, setEdges, toast]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportYaml = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const yamlText = await file.text();
      const { nodes: importedNodes, edges: importedEdges } = await parseYamlToGraph(yamlText);

      // Update nodeId counter to avoid conflicts
      const maxId = importedNodes.reduce((max, node) => {
        const id = parseInt(node.id.replace('node_', ''));
        return isNaN(id) ? max : Math.max(max, id);
      }, nodeId);
      nodeId = maxId + 1;

      setNodes(importedNodes);
      setEdges(importedEdges);
      setSelectedNode(null);

      toast({
        title: "YAML imported",
        description: `Successfully loaded ${importedNodes.length} resources from ${file.name}`,
      });
    } catch (error) {
      console.error('Error importing YAML:', error);
      toast({
        title: "Failed to import YAML",
        description: error instanceof Error ? error.message : "An error occurred while importing the YAML file",
        variant: "destructive",
      });
    }

    // Reset input so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  }, [setNodes, setEdges, toast]);

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
      <header className="h-14 border-b border-border flex items-center justify-between px-2 sm:px-4 bg-card">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <img src="/logo.png" alt="K8s Diagram Builder Logo" className="h-24 sm:h-36 flex-shrink-0" />
          <div className="hidden sm:block h-6 w-px bg-border" />

          {/* Mobile Breadcrumb - Shows selected node with quick actions */}
          {selectedNode && (
            <div className="md:hidden flex items-center gap-1.5 min-w-0 flex-1">
              <button
                onClick={() => setShowProperties(!showProperties)}
                className="flex items-center gap-1.5 min-w-0 flex-1 px-2 py-1 bg-secondary/50 rounded-md border border-border hover:bg-secondary transition-colors"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(var(--node-${selectedNode.data.type}))` }} />
                <span className="text-xs font-medium text-foreground truncate">
                  {selectedNode.data.label}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({selectedNode.data.type})
                </span>
              </button>
            </div>
          )}
          {!selectedNode && (
            <div className="md:hidden flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground truncate">
                {nodes.length} node{nodes.length !== 1 ? 's' : ''} • {edges.length} connection{edges.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={clearDiagram} className="btn-ghost">
              <Plus className="w-4 h-4" />
              New
            </button>
            <button onClick={handleImportYaml} className="btn-ghost">
              <Upload className="w-4 h-4" />
              Import YAML
            </button>
            <button onClick={() => navigate('/tutorial')} className="btn-ghost text-blue-600">
              <GraduationCap className="w-4 h-4" />
              Learn YAML
            </button>
            {/* <div className="relative">
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
            </div> */}
            <button onClick={clearDiagram} className="btn-ghost text-destructive">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="md:hidden btn-ghost"
            aria-label="Toggle palette"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Action Buttons */}
          <button
            onClick={() => setShowProperties(!showProperties)}
            className="md:hidden btn-ghost"
            aria-label="Toggle properties"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowYaml(!showYaml)}
            className="md:hidden btn-ghost"
            aria-label="Toggle YAML"
          >
            <Code className="w-5 h-5" />
          </button>

          {/* Desktop Right Side */}
          {lastSaved && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="w-3 h-3 text-green-500" />
              <span className="hidden lg:inline">Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost hidden sm:inline-flex"
          >
            <Github className="w-4 h-4" />
          </a>
          <span className="text-xs text-muted-foreground hidden lg:inline">v1.0.0</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Sidebar - Node Palette (Desktop: always visible, Mobile: overlay) */}
        <aside className={`
          ${showPalette ? 'absolute' : 'hidden'}
          md:relative md:block
          w-52
          border-r border-border
          flex-shrink-0
          bg-background
          z-40
          h-full
          ${showPalette ? 'shadow-2xl' : ''}
        `}>
          <div className="relative h-full">
            <button
              onClick={() => setShowPalette(false)}
              className="md:hidden absolute top-2 right-2 btn-ghost z-50"
              aria-label="Close palette"
            >
              <X className="w-4 h-4" />
            </button>
            <NodePalette onDragStart={onDragStart} onNodeClick={addNodeToCanvas} onTemplateSelect={handleTemplateSelect} />
          </div>
        </aside>

        {/* Overlay for mobile sidebars */}
        {(showPalette || showProperties || showYaml) && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => {
              setShowPalette(false);
              setShowProperties(false);
              setShowYaml(false);
            }}
          />
        )}

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

        {/* Right Sidebar - Properties + YAML (Desktop: always visible, Mobile: bottom sheet) */}
        <aside className={`
          ${showProperties || showYaml ? 'fixed' : 'hidden'}
          md:relative md:flex
          ${showProperties || showYaml ? 'bottom-0 left-0 right-0' : ''}
          md:w-96
          ${showProperties || showYaml ? 'h-[70vh]' : 'h-auto'}
          md:h-auto
          border-l border-border
          flex-shrink-0
          flex flex-col
          bg-background
          z-40
          ${showProperties || showYaml ? 'rounded-t-2xl' : ''}
          ${showProperties || showYaml ? 'shadow-2xl' : ''}
        `}>
          {/* Mobile: Show either Properties or YAML based on state */}
          <div className="md:hidden h-full flex flex-col">
            {showProperties && (
              <>
                <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
                  <h2 className="text-sm font-semibold">Properties</h2>
                  <button onClick={() => setShowProperties(false)} className="btn-ghost p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto">
                  <PropertiesPanel
                    node={selectedNode}
                    onUpdate={updateNodeData}
                    onClose={() => {
                      setSelectedNode(null);
                      setShowProperties(false);
                    }}
                  />
                </div>
              </>
            )}
            {showYaml && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
                  <h2 className="text-sm font-semibold">Generated YAML</h2>
                  <button onClick={() => setShowYaml(false)} className="btn-ghost p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <YamlPanel yamls={generatedYamls} />
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Show both Properties and YAML split */}
          <div className="hidden md:flex md:flex-col h-full">
            <div className="h-1/2 border-b border-border overflow-hidden">
              <PropertiesPanel
                node={selectedNode}
                onUpdate={updateNodeData}
                onClose={() => setSelectedNode(null)}
              />
            </div>
            <div className="h-1/2 overflow-hidden">
              <YamlPanel yamls={generatedYamls} />
            </div>
          </div>
        </aside>
      </div>

      {/* Hidden file input for YAML import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
