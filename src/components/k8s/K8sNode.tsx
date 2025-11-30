import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
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
import { K8sNodeData, K8sNodeType } from '@/types/k8s';

const nodeConfig: Record<K8sNodeType, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  ingress: { icon: Globe, colorClass: 'text-[hsl(var(--node-ingress))]', bgClass: 'border-[hsl(var(--node-ingress))]' },
  service: { icon: Server, colorClass: 'text-[hsl(var(--node-service))]', bgClass: 'border-[hsl(var(--node-service))]' },
  deployment: { icon: Box, colorClass: 'text-[hsl(var(--node-deployment))]', bgClass: 'border-[hsl(var(--node-deployment))]' },
  configmap: { icon: FileText, colorClass: 'text-[hsl(var(--node-configmap))]', bgClass: 'border-[hsl(var(--node-configmap))]' },
  secret: { icon: Key, colorClass: 'text-[hsl(var(--node-secret))]', bgClass: 'border-[hsl(var(--node-secret))]' },
  pvc: { icon: HardDrive, colorClass: 'text-[hsl(var(--node-pvc))]', bgClass: 'border-[hsl(var(--node-pvc))]' },
  cronjob: { icon: Clock, colorClass: 'text-[hsl(var(--node-cronjob))]', bgClass: 'border-[hsl(var(--node-cronjob))]' },
  hpa: { icon: Activity, colorClass: 'text-[hsl(var(--node-hpa))]', bgClass: 'border-[hsl(var(--node-hpa))]' },
  pod: { icon: Container, colorClass: 'text-[hsl(var(--node-pod))]', bgClass: 'border-[hsl(var(--node-pod))]' },
  sidecar: { icon: Layers, colorClass: 'text-[hsl(var(--node-sidecar))]', bgClass: 'border-[hsl(var(--node-sidecar))]' },
};

function getNodeSummary(data: K8sNodeData): string[] {
  switch (data.type) {
    case 'ingress':
      return [data.host, `Class: ${data.ingressClassName}`];
    case 'service':
      return [`${data.port}:${data.targetPort}`, data.serviceType];
    case 'deployment':
      return [data.image, `Replicas: ${data.replicas}`];
    case 'configmap':
      return [`${data.data.length} keys`];
    case 'secret':
      return [data.secretType, `${data.data.length} keys`];
    case 'pvc':
      return [data.size, data.storageClassName];
    case 'cronjob':
      return [data.schedule, data.image];
    case 'hpa':
      return [`${data.minReplicas}-${data.maxReplicas}`, `CPU: ${data.cpuTarget}%`];
    case 'pod':
      return [data.image];
    case 'sidecar':
      return [data.image, `Purpose: ${data.purpose}`];
    default:
      return [];
  }
}

function K8sNode({ data, selected }: NodeProps<K8sNodeData>) {
  const config = nodeConfig[data.type];
  const Icon = config.icon;
  const summary = getNodeSummary(data);

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !border-card"
      />
      <div className={`node-base ${config.bgClass} ${selected ? 'ring-2 ring-primary' : ''}`}>
        <div className="node-header">
          <Icon className={`node-icon ${config.colorClass}`} />
          <span className="node-title">{data.label}</span>
        </div>
        <div className="node-content">
          {summary.map((line, i) => (
            <div key={i} className="truncate">{line}</div>
          ))}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !border-card"
      />
    </>
  );
}

export default memo(K8sNode);
