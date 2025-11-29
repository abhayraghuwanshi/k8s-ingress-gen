import { useState } from 'react';
import { Node } from 'reactflow';
import { Plus, Trash2, X } from 'lucide-react';
import { K8sNodeData, KeyValue } from '@/types/k8s';

interface PropertiesPanelProps {
  node: Node<K8sNodeData> | null;
  onUpdate: (nodeId: string, data: Partial<K8sNodeData>) => void;
  onClose: () => void;
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
              <label className="label-text">Host</label>
              <input
                type="text"
                className="input-field"
                value={data.host}
                onChange={(e) => update({ host: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Ingress Class</label>
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
                <label className="label-text">TLS Secret Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={data.tlsSecretName}
                  onChange={(e) => update({ tlsSecretName: e.target.value } as Partial<K8sNodeData>)}
                />
              </div>
            )}
            <div>
              <label className="label-text">Annotations</label>
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
              <label className="label-text">Service Name</label>
              <input
                type="text"
                className="input-field"
                value={data.serviceName}
                onChange={(e) => update({ serviceName: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-text">Port</label>
                <input
                  type="number"
                  className="input-field"
                  value={data.port}
                  onChange={(e) => update({ port: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
                />
              </div>
              <div>
                <label className="label-text">Target Port</label>
                <input
                  type="number"
                  className="input-field"
                  value={data.targetPort}
                  onChange={(e) => update({ targetPort: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
                />
              </div>
            </div>
            <div>
              <label className="label-text">Service Type</label>
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
              <label className="label-text">Selector Labels</label>
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
              <label className="label-text">Deployment Name</label>
              <input
                type="text"
                className="input-field"
                value={data.deploymentName}
                onChange={(e) => update({ deploymentName: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Replicas</label>
              <input
                type="number"
                className="input-field"
                value={data.replicas}
                onChange={(e) => update({ replicas: parseInt(e.target.value) || 1 } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Container Name</label>
              <input
                type="text"
                className="input-field"
                value={data.containerName}
                onChange={(e) => update({ containerName: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Image</label>
              <input
                type="text"
                className="input-field"
                value={data.image}
                onChange={(e) => update({ image: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Container Port</label>
              <input
                type="number"
                className="input-field"
                value={data.containerPort}
                onChange={(e) => update({ containerPort: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Labels</label>
              <KeyValueEditor
                items={data.labels}
                onChange={(labels) => update({ labels } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Environment Variables</label>
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
              <label className="label-text">Name</label>
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Data</label>
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
              <label className="label-text">Name</label>
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Type</label>
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
              <label className="label-text">Data (auto base64 encoded)</label>
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
              <label className="label-text">Name</label>
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Storage Class</label>
              <input
                type="text"
                className="input-field"
                value={data.storageClassName}
                onChange={(e) => update({ storageClassName: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Size</label>
              <input
                type="text"
                className="input-field"
                value={data.size}
                onChange={(e) => update({ size: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}

        {/* CronJob fields */}
        {data.type === 'cronjob' && (
          <>
            <div>
              <label className="label-text">Name</label>
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Schedule (cron)</label>
              <input
                type="text"
                className="input-field"
                value={data.schedule}
                onChange={(e) => update({ schedule: e.target.value } as Partial<K8sNodeData>)}
                placeholder="*/5 * * * *"
              />
            </div>
            <div>
              <label className="label-text">Image</label>
              <input
                type="text"
                className="input-field"
                value={data.image}
                onChange={(e) => update({ image: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}

        {/* HPA fields */}
        {data.type === 'hpa' && (
          <>
            <div>
              <label className="label-text">Name</label>
              <input
                type="text"
                className="input-field"
                value={data.name}
                onChange={(e) => update({ name: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div>
              <label className="label-text">Target Deployment</label>
              <input
                type="text"
                className="input-field"
                value={data.targetDeployment}
                onChange={(e) => update({ targetDeployment: e.target.value } as Partial<K8sNodeData>)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-text">Min Replicas</label>
                <input
                  type="number"
                  className="input-field"
                  value={data.minReplicas}
                  onChange={(e) => update({ minReplicas: parseInt(e.target.value) || 1 } as Partial<K8sNodeData>)}
                />
              </div>
              <div>
                <label className="label-text">Max Replicas</label>
                <input
                  type="number"
                  className="input-field"
                  value={data.maxReplicas}
                  onChange={(e) => update({ maxReplicas: parseInt(e.target.value) || 10 } as Partial<K8sNodeData>)}
                />
              </div>
            </div>
            <div>
              <label className="label-text">CPU Target (%)</label>
              <input
                type="number"
                className="input-field"
                value={data.cpuTarget}
                onChange={(e) => update({ cpuTarget: parseInt(e.target.value) || 80 } as Partial<K8sNodeData>)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
