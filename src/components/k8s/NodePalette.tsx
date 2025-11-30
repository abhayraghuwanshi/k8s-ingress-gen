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
  Layers
} from 'lucide-react';
import { K8sNodeType } from '@/types/k8s';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: K8sNodeType) => void;
  onNodeClick?: (nodeType: K8sNodeType) => void;
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

export default function NodePalette({ onDragStart, onNodeClick }: NodePaletteProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="panel-title">Resources</span>
      </div>
      <div className="panel-content flex-1 overflow-y-auto scrollbar-thin space-y-1">
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
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="hidden md:inline">Drag resources onto the canvas</span>
          <span className="md:hidden">Tap a resource to add it to the canvas</span>
        </p>
      </div>
    </div>
  );
}
