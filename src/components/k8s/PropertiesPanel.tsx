import { useState } from 'react';
import { Node } from 'reactflow';
import { Plus, Trash2, X, HelpCircle } from 'lucide-react';
import { K8sNodeData, KeyValue } from '@/types/k8s';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFieldHelp } from '@/utils/fieldHelp';

interface PropertiesPanelProps {
  node: Node<K8sNodeData> | null;
  onUpdate: (nodeId: string, data: Partial<K8sNodeData>) => void;
  onClose: () => void;
}

function FieldLabel({ label, helpKey }: { label: string; helpKey: string }) {
  const help = getFieldHelp(helpKey);

  if (!help) {
    return <label className="label-text">{label}</label>;
  }

  return (
    <div className="flex items-center justify-between mb-1">
      <label className="label-text">{label}</label>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2 text-xs">
              <p className="font-medium text-foreground">{help.description}</p>
              {help.example && (
                <div>
                  <p className="text-muted-foreground font-semibold mb-1">Examples:</p>
                  <p className="text-muted-foreground font-mono whitespace-pre-line">{help.example}</p>
                </div>
              )}
              {help.validationRules && (
                <div>
                  <p className="text-muted-foreground font-semibold mb-1">Rules:</p>
                  <p className="text-muted-foreground">{help.validationRules}</p>
                </div>
              )}
              {help.learnMore && (
                <p className="text-blue-400 italic">{help.learnMore}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function KeyValueEditor({ 
  items, 
  onChange, 
  keyLabel = 'Key',
  valueLabel = 'Value'
}: { 
  items: KeyValue[]; 
  onChange: (items: KeyValue[]) => void;
  keyLabel?: string;
  valueLabel?: string;
}) {
  const addItem = () => onChange([...items, { key: '', value: '' }]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder={keyLabel}
            value={item.key}
            onChange={(e) => updateItem(i, 'key', e.target.value)}
          />
          <input
            type="text"
            className="input-field flex-1"
            placeholder={valueLabel}
            value={item.value}
            onChange={(e) => updateItem(i, 'value', e.target.value)}
          />
          <button onClick={() => removeItem(i)} className="btn-ghost p-2 text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={addItem} className="btn-secondary w-full">
        <Plus className="w-4 h-4" /> Add
      </button>
    </div>
  );
}

export default function PropertiesPanel({ node, onUpdate, onClose }: PropertiesPanelProps) {
  if (!node) {
    return (
      <div className="panel h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a node to edit properties</p>
      </div>
    );
  }

  const data = node.data;
  const update = (changes: Partial<K8sNodeData>) => {
    onUpdate(node.id, changes);
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="panel-title">{data.label} Properties</span>
        <button onClick={onClose} className="btn-ghost p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="panel-content flex-1 overflow-y-auto scrollbar-thin space-y-4">
        {/* Common label field */}
        <div>
          <label className="label-text">Label</label>
          <input
            type="text"
            className="input-field"
            value={data.label}
            onChange={(e) => update({ label: e.target.value } as Partial<K8sNodeData>)}
          />
        </div>

        {/* Ingress fields */}
        {data.type === 'ingress' && (
          <>
            <div>
              <FieldLabel label="Host" helpKey="ingress.host" />
              <input
                type="text"
                className="input-field"
                value={data.host}
                onChange={(e) => update({ host: e.target.value } as Partial<K8sNodeData>)}
                placeholder="api.example.com"
              />
            </div>
            <div>
              <FieldLabel label="Ingress Class" helpKey="ingress.ingressClassName" />
              <select
                className="input-field"
                value={data.ingressClassName}
                onChange={(e) => update({ ingressClassName: e.target.value } as Partial<K8sNodeData>)}
              >
                <option value="nginx">nginx</option>
                <option value="traefik">traefik</option>
                <option value="istio">istio</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableTLS"
                checked={data.enableTLS}
                onChange={(e) => update({ enableTLS: e.target.checked } as Partial<K8sNodeData>)}
                className="w-4 h-4"
              />
              <label htmlFor="enableTLS" className="text-sm text-foreground">Enable TLS</label>
            </div>
            {data.enableTLS && (
              <div>
                <FieldLabel label="TLS Secret Name" helpKey="ingress.tlsSecretName" />
                <input
                  type="text"
                  className="input-field"
                  value={data.tlsSecretName}
                  onChange={(e) => update({ tlsSecretName: e.target.value } as Partial<K8sNodeData>)}
                  placeholder="tls-secret"
                />
              </div>
            )}
            <div>
              <FieldLabel label="Annotations" helpKey="ingress.annotations" />
              <KeyValueEditor
                items={data.annotations}
                onChange={(annotations) => update({ annotations } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}

        {/* Service fields */}
        {data.type === 'service' && (
          <>
            <div>
              <FieldLabel label="Service Name" helpKey="service.serviceName" />
              <input
                type="text"
                className="input-field"
                value={data.serviceName}
                onChange={(e) => update({ serviceName: e.target.value } as Partial<K8sNodeData>)}
                placeholder="api-service"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel label="Port" helpKey="service.port" />
                <input
                  type="number"
                  className="input-field"
                  value={data.port}
                  onChange={(e) => update({ port: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
                  placeholder="80"
                />
              </div>
              <div>
                <FieldLabel label="Target Port" helpKey="service.targetPort" />
                <input
                  type="number"
                  className="input-field"
                  value={data.targetPort}
                  onChange={(e) => update({ targetPort: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
                  placeholder="8080"
                />
              </div>
            </div>
            <div>
              <FieldLabel label="Service Type" helpKey="service.serviceType" />
              <select
                className="input-field"
                value={data.serviceType}
                onChange={(e) => update({ serviceType: e.target.value as 'ClusterIP' | 'NodePort' | 'LoadBalancer' } as Partial<K8sNodeData>)}
              >
                <option value="ClusterIP">ClusterIP</option>
                <option value="NodePort">NodePort</option>
                <option value="LoadBalancer">LoadBalancer</option>
              </select>
            </div>
            <div>
              <FieldLabel label="Selector Labels" helpKey="service.selectorLabels" />
              <KeyValueEditor
                items={data.selectorLabels}
                onChange={(selectorLabels) => update({ selectorLabels } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}

        {/* Deployment fields */}
        {data.type === 'deployment' && (
          <>
            <div>
              <FieldLabel label="Deployment Name" helpKey="deployment.deploymentName" />
              <input
                type="text"
                className="input-field"
                value={data.deploymentName}
                onChange={(e) => update({ deploymentName: e.target.value } as Partial<K8sNodeData>)}
                placeholder="backend-deployment"
              />
            </div>
            <div>
              <FieldLabel label="Replicas" helpKey="deployment.replicas" />
              <input
                type="number"
                className="input-field"
                value={data.replicas}
                onChange={(e) => update({ replicas: parseInt(e.target.value) || 1 } as Partial<K8sNodeData>)}
                placeholder="3"
              />
            </div>
            <div>
              <FieldLabel label="Container Name" helpKey="deployment.containerName" />
              <input
                type="text"
                className="input-field"
                value={data.containerName}
                onChange={(e) => update({ containerName: e.target.value } as Partial<K8sNodeData>)}
                placeholder="app"
              />
            </div>
            <div>
              <FieldLabel label="Image" helpKey="deployment.image" />
              <input
                type="text"
                className="input-field"
                value={data.image}
                onChange={(e) => update({ image: e.target.value } as Partial<K8sNodeData>)}
                placeholder="nginx:alpine"
              />
            </div>
            <div>
              <FieldLabel label="Container Port" helpKey="deployment.containerPort" />
              <input
                type="number"
                className="input-field"
                value={data.containerPort}
                onChange={(e) => update({ containerPort: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
                placeholder="8080"
              />
            </div>
            <div>
              <FieldLabel label="Labels" helpKey="deployment.labels" />
              <KeyValueEditor
                items={data.labels}
                onChange={(labels) => update({ labels } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <FieldLabel label="Environment Variables" helpKey="deployment.envVars" />
              <KeyValueEditor
                items={data.envVars}
                onChange={(envVars) => update({ envVars } as Partial<K8sNodeData>)}
                keyLabel="Name"
              />
            </div>
          </>
        )}

        {/* ConfigMap fields */}
        {data.type === 'configmap' && (
          <>
            <div>
              <FieldLabel label="Name" helpKey="configmap.name" />
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
                placeholder="app-config"
              />
            </div>
            <div>
              <FieldLabel label="Data" helpKey="configmap.data" />
              <KeyValueEditor
                items={data.data}
                onChange={(dataItems) => update({ data: dataItems } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}

        {/* Secret fields */}
        {data.type === 'secret' && (
          <>
            <div>
              <FieldLabel label="Name" helpKey="secret.name" />
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
                placeholder="db-credentials"
              />
            </div>
            <div>
              <FieldLabel label="Type" helpKey="secret.secretType" />
              <select
                className="input-field"
                value={data.secretType}
                onChange={(e) => update({ secretType: e.target.value as 'Opaque' | 'kubernetes.io/tls' } as Partial<K8sNodeData>)}
              >
                <option value="Opaque">Opaque</option>
                <option value="kubernetes.io/tls">kubernetes.io/tls</option>
              </select>
            </div>
            <div>
              <FieldLabel label="Data (auto base64 encoded)" helpKey="secret.data" />
              <KeyValueEditor
                items={data.data}
                onChange={(dataItems) => update({ data: dataItems } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}

        {/* PVC fields */}
        {data.type === 'pvc' && (
          <>
            <div>
              <FieldLabel label="Name" helpKey="pvc.name" />
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
                placeholder="data-pvc"
              />
            </div>
            <div>
              <FieldLabel label="Storage Class" helpKey="pvc.storageClassName" />
              <input
                type="text"
                className="input-field"
                value={data.storageClassName}
                onChange={(e) => update({ storageClassName: e.target.value } as Partial<K8sNodeData>)}
                placeholder="standard"
              />
            </div>
            <div>
              <FieldLabel label="Size" helpKey="pvc.size" />
              <input
                type="text"
                className="input-field"
                value={data.size}
                onChange={(e) => update({ size: e.target.value } as Partial<K8sNodeData>)}
                placeholder="10Gi"
              />
            </div>
          </>
        )}

        {/* CronJob fields */}
        {data.type === 'cronjob' && (
          <>
            <div>
              <FieldLabel label="Name" helpKey="cronjob.name" />
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
                placeholder="backup-job"
              />
            </div>
            <div>
              <FieldLabel label="Schedule (cron)" helpKey="cronjob.schedule" />
              <input
                type="text"
                className="input-field"
                value={data.schedule}
                onChange={(e) => update({ schedule: e.target.value } as Partial<K8sNodeData>)}
                placeholder="0 2 * * *"
              />
            </div>
            <div>
              <FieldLabel label="Image" helpKey="cronjob.image" />
              <input
                type="text"
                className="input-field"
                value={data.image}
                onChange={(e) => update({ image: e.target.value } as Partial<K8sNodeData>)}
                placeholder="busybox:latest"
              />
            </div>
          </>
        )}

        {/* HPA fields */}
        {data.type === 'hpa' && (
          <>
            <div>
              <FieldLabel label="Name" helpKey="hpa.name" />
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
                placeholder="backend-hpa"
              />
            </div>
            <div>
              <FieldLabel label="Target Deployment" helpKey="hpa.targetDeployment" />
              <input
                type="text"
                className="input-field"
                value={data.targetDeployment}
                onChange={(e) => update({ targetDeployment: e.target.value } as Partial<K8sNodeData>)}
                placeholder="backend-deployment"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel label="Min Replicas" helpKey="hpa.minReplicas" />
                <input
                  type="number"
                  className="input-field"
                  value={data.minReplicas}
                  onChange={(e) => update({ minReplicas: parseInt(e.target.value) || 1 } as Partial<K8sNodeData>)}
                  placeholder="2"
                />
              </div>
              <div>
                <FieldLabel label="Max Replicas" helpKey="hpa.maxReplicas" />
                <input
                  type="number"
                  className="input-field"
                  value={data.maxReplicas}
                  onChange={(e) => update({ maxReplicas: parseInt(e.target.value) || 10 } as Partial<K8sNodeData>)}
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <FieldLabel label="CPU Target (%)" helpKey="hpa.cpuTarget" />
              <input
                type="number"
                className="input-field"
                value={data.cpuTarget}
                onChange={(e) => update({ cpuTarget: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
                placeholder="80"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
