import * as yaml from 'js-yaml';
import { Node, Edge } from 'reactflow';
import { K8sNodeData, K8sNodeType } from '@/types/k8s';
import { YAML_BASE } from '@/types/template';

interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: any;
}

let nodeIdCounter = 1000; // Start with a high number to avoid conflicts

const getNextNodeId = () => `node_${nodeIdCounter++}`;

/**
 * Parses a YAML string and converts it into nodes and edges for the diagram
 */
export async function parseYamlToGraph(yamlText: string): Promise<{ nodes: Node<K8sNodeData>[]; edges: Edge[] }> {
  const nodes: Node<K8sNodeData>[] = [];
  const edges: Edge[] = [];

  // Parse YAML (can be multiple documents separated by ---)
  const documents = yaml.loadAll(yamlText) as K8sResource[];

  // Track resources by type for positioning
  const positionTracker: Record<string, number> = {};
  const getPosition = (type: string) => {
    const count = positionTracker[type] || 0;
    positionTracker[type] = count + 1;
    return {
      x: 100 + (count % 3) * 300,
      y: 100 + Math.floor(count / 3) * 180 + getYOffset(type)
    };
  };

  const getYOffset = (kind: string): number => {
    const order = ['Ingress', 'Service', 'Deployment', 'Pod', 'Sidecar', 'ConfigMap', 'Secret', 'PersistentVolumeClaim', 'CronJob', 'HorizontalPodAutoscaler'];
    return order.indexOf(kind) * 160;
  };

  // Map to track resources by name and kind for relationship building
  const resourceMap = new Map<string, { nodeId: string; resource: K8sResource }>();

  // Convert each resource to a node
  for (const doc of documents) {
    if (!doc || !doc.kind) continue;

    const nodeType = mapKindToNodeType(doc.kind);
    if (!nodeType) continue;

    const nodeId = getNextNodeId();
    const position = getPosition(doc.kind);

    const nodeData = convertResourceToNodeData(doc, nodeType);
    if (!nodeData) continue;

    nodes.push({
      id: nodeId,
      type: 'k8sNode',
      position,
      data: nodeData
    });

    // Track this resource for relationship building
    const resourceKey = `${doc.kind}:${doc.metadata.name}`;
    resourceMap.set(resourceKey, { nodeId, resource: doc });
  }

  // Build edges based on K8s relationships
  let edgeIdCounter = 0;
  const createEdge = (sourceId: string, targetId: string) => {
    edges.push({
      id: `e${edgeIdCounter++}`,
      source: sourceId,
      target: targetId,
      animated: true
    });
  };

  for (const [key, { nodeId, resource }] of resourceMap) {
    const kind = resource.kind;

    // Ingress -> Service connections
    if (kind === 'Ingress') {
      const rules = resource.spec?.rules || [];
      for (const rule of rules) {
        const paths = rule.http?.paths || [];
        for (const path of paths) {
          const serviceName = path.backend?.service?.name;
          if (serviceName) {
            const serviceKey = `Service:${serviceName}`;
            const service = resourceMap.get(serviceKey);
            if (service) {
              createEdge(nodeId, service.nodeId);
            }
          }
        }
      }
    }

    // Service -> Deployment/Pod connections (based on selector labels)
    if (kind === 'Service') {
      const serviceSelector = resource.spec?.selector || {};

      // Find deployments/pods with matching labels
      for (const [targetKey, targetInfo] of resourceMap) {
        if (targetKey.startsWith('Deployment:') || targetKey.startsWith('Pod:')) {
          const targetResource = targetInfo.resource;
          const targetLabels = targetResource.spec?.template?.metadata?.labels ||
                              targetResource.metadata?.labels || {};

          // Check if all service selector labels match target labels
          const matches = Object.entries(serviceSelector).every(
            ([key, value]) => targetLabels[key] === value
          );

          if (matches) {
            createEdge(nodeId, targetInfo.nodeId);
          }
        }
      }
    }

    // Deployment/CronJob -> ConfigMap/Secret connections
    if (kind === 'Deployment' || kind === 'CronJob') {
      const containers = kind === 'Deployment'
        ? resource.spec?.template?.spec?.containers || []
        : resource.spec?.jobTemplate?.spec?.template?.spec?.containers || [];

      for (const container of containers) {
        // envFrom references
        const envFrom = container.envFrom || [];
        for (const ref of envFrom) {
          if (ref.configMapRef?.name) {
            const configMapKey = `ConfigMap:${ref.configMapRef.name}`;
            const configMap = resourceMap.get(configMapKey);
            if (configMap) {
              createEdge(nodeId, configMap.nodeId);
            }
          }
          if (ref.secretRef?.name) {
            const secretKey = `Secret:${ref.secretRef.name}`;
            const secret = resourceMap.get(secretKey);
            if (secret) {
              createEdge(nodeId, secret.nodeId);
            }
          }
        }

        // env valueFrom references
        const env = container.env || [];
        for (const envVar of env) {
          if (envVar.valueFrom?.configMapKeyRef?.name) {
            const configMapKey = `ConfigMap:${envVar.valueFrom.configMapKeyRef.name}`;
            const configMap = resourceMap.get(configMapKey);
            if (configMap) {
              createEdge(nodeId, configMap.nodeId);
            }
          }
          if (envVar.valueFrom?.secretKeyRef?.name) {
            const secretKey = `Secret:${envVar.valueFrom.secretKeyRef.name}`;
            const secret = resourceMap.get(secretKey);
            if (secret) {
              createEdge(nodeId, secret.nodeId);
            }
          }
        }
      }

      // Volume mounts -> PVC connections
      const volumes = kind === 'Deployment'
        ? resource.spec?.template?.spec?.volumes || []
        : resource.spec?.jobTemplate?.spec?.template?.spec?.volumes || [];

      for (const volume of volumes) {
        if (volume.persistentVolumeClaim?.claimName) {
          const pvcKey = `PersistentVolumeClaim:${volume.persistentVolumeClaim.claimName}`;
          const pvc = resourceMap.get(pvcKey);
          if (pvc) {
            createEdge(nodeId, pvc.nodeId);
          }
        }
        if (volume.configMap?.name) {
          const configMapKey = `ConfigMap:${volume.configMap.name}`;
          const configMap = resourceMap.get(configMapKey);
          if (configMap) {
            createEdge(nodeId, configMap.nodeId);
          }
        }
        if (volume.secret?.secretName) {
          const secretKey = `Secret:${volume.secret.secretName}`;
          const secret = resourceMap.get(secretKey);
          if (secret) {
            createEdge(nodeId, secret.nodeId);
          }
        }
      }
    }

    // HPA -> Deployment connections
    if (kind === 'HorizontalPodAutoscaler') {
      const targetName = resource.spec?.scaleTargetRef?.name;
      const targetKind = resource.spec?.scaleTargetRef?.kind || 'Deployment';
      if (targetName) {
        const targetKey = `${targetKind}:${targetName}`;
        const target = resourceMap.get(targetKey);
        if (target) {
          createEdge(nodeId, target.nodeId);
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Maps Kubernetes resource kind to internal node type
 */
function mapKindToNodeType(kind: string): K8sNodeType | null {
  const mapping: Record<string, K8sNodeType> = {
    'Ingress': 'ingress',
    'Service': 'service',
    'Deployment': 'deployment',
    'Pod': 'pod',
    'ConfigMap': 'configmap',
    'Secret': 'secret',
    'PersistentVolumeClaim': 'pvc',
    'CronJob': 'cronjob',
    'HorizontalPodAutoscaler': 'hpa'
  };
  return mapping[kind] || null;
}

/**
 * Converts a K8s resource object to node data
 */
function convertResourceToNodeData(resource: K8sResource, nodeType: K8sNodeType): K8sNodeData | null {
  const name = resource.metadata?.name || 'Unnamed';

  switch (nodeType) {
    case 'ingress':
      return {
        type: 'ingress',
        label: name,
        host: resource.spec?.rules?.[0]?.host || 'example.com',
        paths: resource.spec?.rules?.[0]?.http?.paths?.map((p: any) => ({
          path: p.path || '/',
          pathType: p.pathType || 'Prefix',
          serviceName: p.backend?.service?.name || '',
          servicePort: p.backend?.service?.port?.number || 80
        })) || [{ path: '/', pathType: 'Prefix', serviceName: '', servicePort: 80 }],
        ingressClassName: resource.spec?.ingressClassName || 'nginx',
        enableTLS: !!resource.spec?.tls,
        tlsSecretName: resource.spec?.tls?.[0]?.secretName || '',
        annotations: Object.entries(resource.metadata?.annotations || {}).map(([key, value]) => ({ key, value: String(value) }))
      };

    case 'service':
      return {
        type: 'service',
        label: name,
        serviceName: name,
        port: resource.spec?.ports?.[0]?.port || 80,
        targetPort: resource.spec?.ports?.[0]?.targetPort || 8080,
        serviceType: resource.spec?.type || 'ClusterIP',
        selectorLabels: Object.entries(resource.spec?.selector || {}).map(([key, value]) => ({ key, value: String(value) }))
      };

    case 'deployment':
      const container = resource.spec?.template?.spec?.containers?.[0];
      return {
        type: 'deployment',
        label: name,
        deploymentName: name,
        replicas: resource.spec?.replicas || 1,
        containerName: container?.name || 'main',
        image: container?.image || 'nginx:latest',
        containerPort: container?.ports?.[0]?.containerPort || 80,
        envVars: (container?.env || []).map((e: any) => ({ key: e.name || '', value: e.value || '' })),
        labels: Object.entries(resource.spec?.template?.metadata?.labels || {}).map(([key, value]) => ({ key, value: String(value) })),
        volumeMounts: [],
        cloudProvider: 'none',
        cloudProviderTemplateId: undefined,
        cloudProviderFields: {},
        annotations: Object.entries(resource.metadata?.annotations || {}).map(([key, value]) => ({ key, value: String(value) }))
      };

    case 'pod':
      const podContainer = resource.spec?.containers?.[0];
      return {
        type: 'pod',
        label: name,
        name: name,
        image: podContainer?.image || 'nginx:latest',
        containerPort: podContainer?.ports?.[0]?.containerPort || 80
      };

    case 'configmap':
      return {
        type: 'configmap',
        label: name,
        name: name,
        data: Object.entries(resource.data || {}).map(([key, value]) => ({ key, value: String(value) }))
      };

    case 'secret':
      return {
        type: 'secret',
        label: name,
        name: name,
        secretType: resource.type || 'Opaque',
        data: Object.entries(resource.data || {}).map(([key, value]) => ({ key, value: String(value) })),
        cloudProvider: 'none',
        cloudProviderTemplateId: undefined,
        cloudProviderFields: {},
        annotations: Object.entries(resource.metadata?.annotations || {}).map(([key, value]) => ({ key, value: String(value) }))
      };

    case 'pvc':
      return {
        type: 'pvc',
        label: name,
        name: name,
        storageClassName: resource.spec?.storageClassName || 'standard',
        size: resource.spec?.resources?.requests?.storage || '1Gi',
        accessModes: resource.spec?.accessModes || ['ReadWriteOnce'],
        cloudProvider: 'none',
        cloudProviderTemplateId: undefined,
        cloudProviderFields: {},
        annotations: Object.entries(resource.metadata?.annotations || {}).map(([key, value]) => ({ key, value: String(value) }))
      };

    case 'cronjob':
      const jobContainer = resource.spec?.jobTemplate?.spec?.template?.spec?.containers?.[0];
      return {
        type: 'cronjob',
        label: name,
        name: name,
        schedule: resource.spec?.schedule || '*/5 * * * *',
        image: jobContainer?.image || 'busybox:latest',
        command: jobContainer?.command || [],
        args: jobContainer?.args || []
      };

    case 'hpa':
      return {
        type: 'hpa',
        label: name,
        name: name,
        targetDeployment: resource.spec?.scaleTargetRef?.name || '',
        minReplicas: resource.spec?.minReplicas || 1,
        maxReplicas: resource.spec?.maxReplicas || 10,
        cpuTarget: resource.spec?.targetCPUUtilizationPercentage || resource.spec?.metrics?.[0]?.resource?.target?.averageUtilization || 80
      };

    case 'sidecar':
      const sidecarContainer = resource.spec?.containers?.[0] || resource.spec?.template?.spec?.containers?.[0];
      return {
        type: 'sidecar',
        label: name,
        containerName: sidecarContainer?.name || name,
        image: sidecarContainer?.image || 'nginx:latest',
        containerType: 'sidecar',
        purpose: 'custom',
        containerPort: sidecarContainer?.ports?.[0]?.containerPort,
        envVars: (sidecarContainer?.env || []).map((e: any) => ({ key: e.name || '', value: e.value || '' })),
        command: sidecarContainer?.command || [],
        args: sidecarContainer?.args || [],
        volumeMounts: [],
        cloudProvider: 'none',
        cloudProviderTemplateId: undefined,
        cloudProviderFields: {}
      };

    default:
      return null;
  }
}

/**
 * Fetches and parses a template YAML from the GitHub repository
 */
export async function fetchTemplateYaml(path: string): Promise<{ nodes: Node<K8sNodeData>[]; edges: Edge[] }> {
  const url = `${YAML_BASE}/${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.statusText}`);
  }

  const yamlText = await response.text();
  return parseYamlToGraph(yamlText);
}
