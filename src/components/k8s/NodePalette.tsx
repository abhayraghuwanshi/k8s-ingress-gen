import { useEffect, useState } from 'react';
import {
  Globe,
  Server,
  Box,
  FileText,
  Key,
  HardDrive,
  Clock,
  Activity,
  Container,
  Layers,
  Search,
  Loader2
} from 'lucide-react';
import { K8sNodeType } from '@/types/k8s';
import { TemplateItem, INDEX_URL } from '@/types/template';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: K8sNodeType) => void;
  onNodeClick?: (nodeType: K8sNodeType) => void;
  onTemplateSelect?: (template: TemplateItem) => void;
}

const paletteItems: { type: K8sNodeType; label: string; icon: React.ElementType; colorClass: string; colorVar: string; description: string }[] = [
  { type: 'ingress', label: 'Ingress', icon: Globe, colorClass: 'text-[hsl(var(--node-ingress))]', colorVar: 'hsl(var(--node-ingress))', description: 'Route external traffic' },
  { type: 'service', label: 'Service', icon: Server, colorClass: 'text-[hsl(var(--node-service))]', colorVar: 'hsl(var(--node-service))', description: 'Expose pods' },
  { type: 'deployment', label: 'Deployment', icon: Box, colorClass: 'text-[hsl(var(--node-deployment))]', colorVar: 'hsl(var(--node-deployment))', description: 'Deploy containers' },
  { type: 'pod', label: 'Pod', icon: Container, colorClass: 'text-[hsl(var(--node-pod))]', colorVar: 'hsl(var(--node-pod))', description: 'Standalone pod' },
  { type: 'sidecar', label: 'Sidecar', icon: Layers, colorClass: 'text-[hsl(var(--node-sidecar))]', colorVar: 'hsl(var(--node-sidecar))', description: 'Helper container' },
  { type: 'configmap', label: 'ConfigMap', icon: FileText, colorClass: 'text-[hsl(var(--node-configmap))]', colorVar: 'hsl(var(--node-configmap))', description: 'Configuration data' },
  { type: 'secret', label: 'Secret', icon: Key, colorClass: 'text-[hsl(var(--node-secret))]', colorVar: 'hsl(var(--node-secret))', description: 'Sensitive data' },
  { type: 'pvc', label: 'PVC', icon: HardDrive, colorClass: 'text-[hsl(var(--node-pvc))]', colorVar: 'hsl(var(--node-pvc))', description: 'Persistent storage' },
  { type: 'cronjob', label: 'CronJob', icon: Clock, colorClass: 'text-[hsl(var(--node-cronjob))]', colorVar: 'hsl(var(--node-cronjob))', description: 'Scheduled tasks' },
  { type: 'hpa', label: 'HPA', icon: Activity, colorClass: 'text-[hsl(var(--node-hpa))]', colorVar: 'hsl(var(--node-hpa))', description: 'Auto-scale pods' },
];

export default function NodePalette({ onDragStart, onNodeClick, onTemplateSelect }: NodePaletteProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(INDEX_URL);
        if (!response.ok) {
          throw new Error('Failed to load templates');
        }
        const data: TemplateItem[] = await response.json();
        setTemplates(data);
      } catch (err) {
        setError('Failed to load templates');
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const searchLower = searchText.toLowerCase();
    return (
      template.title.toLowerCase().includes(searchLower) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="panel-title">Build from Scratch</span>
      </div>
      <div className="panel-content overflow-y-auto scrollbar-thin space-y-1 border-b border-border pb-3">
        {paletteItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              className="palette-item group cursor-pointer"
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              onClick={() => onNodeClick?.(item.type)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 md:hidden group-hover:block"
                  style={{ backgroundColor: item.colorVar }}
                />
                <Icon className={`w-4 h-4 ${item.colorClass} flex-shrink-0`} />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm text-foreground truncate">{item.label}</span>
                  <span className="text-xs text-muted-foreground md:hidden">{item.description}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Templates Section */}
      <div className="panel-header border-t border-border">
        <span className="panel-title">Templates</span>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
          </div>
        )}
        {error && !loading && (
          <div className="px-3 py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        {!loading && !error && filteredTemplates.length === 0 && searchText && (
          <div className="px-3 py-4">
            <p className="text-sm text-muted-foreground">No templates found</p>
          </div>
        )}
        {!loading && !error && filteredTemplates.length > 0 && (
          <div className="space-y-1 p-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-2.5 rounded-md border border-border bg-card hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => onTemplateSelect?.(template)}
              >
                <div className="text-sm font-medium text-foreground mb-1 truncate">
                  {template.title}
                </div>
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="hidden md:inline">Drag resources or select templates</span>
          <span className="md:hidden">Tap a resource or template to add</span>
        </p>
      </div>
    </div>
  );
}
