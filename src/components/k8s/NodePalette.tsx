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
}

const paletteItems: { type: K8sNodeType; label: string; icon: React.ElementType; colorClass: string }[] = [
  { type: 'ingress', label: 'Ingress', icon: Globe, colorClass: 'text-[hsl(var(--node-ingress))]' },
  { type: 'service', label: 'Service', icon: Server, colorClass: 'text-[hsl(var(--node-service))]' },
  { type: 'deployment', label: 'Deployment', icon: Box, colorClass: 'text-[hsl(var(--node-deployment))]' },
  { type: 'pod', label: 'Pod', icon: Container, colorClass: 'text-[hsl(var(--node-pod))]' },
  { type: 'sidecar', label: 'Sidecar', icon: Layers, colorClass: 'text-[hsl(var(--node-sidecar))]' },
  { type: 'configmap', label: 'ConfigMap', icon: FileText, colorClass: 'text-[hsl(var(--node-configmap))]' },
  { type: 'secret', label: 'Secret', icon: Key, colorClass: 'text-[hsl(var(--node-secret))]' },
  { type: 'pvc', label: 'PVC', icon: HardDrive, colorClass: 'text-[hsl(var(--node-pvc))]' },
  { type: 'cronjob', label: 'CronJob', icon: Clock, colorClass: 'text-[hsl(var(--node-cronjob))]' },
  { type: 'hpa', label: 'HPA', icon: Activity, colorClass: 'text-[hsl(var(--node-hpa))]' },
];

export default function NodePalette({ onDragStart }: NodePaletteProps) {
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
              className="palette-item"
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
            >
              <Icon className={`w-4 h-4 ${item.colorClass}`} />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Drag resources onto the canvas to build your architecture
        </p>
      </div>
    </div>
  );
}
