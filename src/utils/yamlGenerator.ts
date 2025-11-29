import { Node, Edge } from 'reactflow';
import { 
  K8sNodeData, 
  IngressNodeData, 
  ServiceNodeData, 
  DeploymentNodeData,
  ConfigMapNodeData,
  SecretNodeData,
  PVCNodeData,
  CronJobNodeData,
  HPANodeData,
  GeneratedYaml 
} from '@/types/k8s';

function getConnectedNodes(nodeId: string, edges: Edge[], nodes: Node<K8sNodeData>[], direction: 'source' | 'target'): Node<K8sNodeData>[] {
  const connectedEdges = edges.filter(e => direction === 'source' ? e.source === nodeId : e.target === nodeId);
  const connectedIds = connectedEdges.map(e => direction === 'source' ? e.target : e.source);
  return nodes.filter(n => connectedIds.includes(n.id));
}

function generateIngressYaml(data: IngressNodeData, connectedServices: ServiceNodeData[]): string {
  const paths = data.paths.length > 0 ? data.paths : connectedServices.map(s => ({
    path: '/',
    pathType: 'Prefix' as const,
    serviceName: s.serviceName,
    servicePort: s.port,
  }));

  let yaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${data.label.toLowerCase().replace(/\s+/g, '-')}-ingress`;

  if (data.annotations.length > 0) {
    yaml += `\n  annotations:`;
    data.annotations.forEach(a => {
      yaml += `\n    ${a.key}: "${a.value}"`;
    });
  }

  yaml += `
spec:
  ingressClassName: ${data.ingressClassName}`;

  if (data.enableTLS && data.tlsSecretName) {
    yaml += `
  tls:
    - hosts:
        - ${data.host}
      secretName: ${data.tlsSecretName}`;
  }

  yaml += `
  rules:
    - host: ${data.host}
      http:
        paths:`;

  paths.forEach(p => {
    const serviceName = p.serviceName || connectedServices[0]?.serviceName || 'my-service';
    const servicePort = p.servicePort || connectedServices[0]?.port || 80;
    yaml += `
          - path: ${p.path}
            pathType: ${p.pathType}
            backend:
              service:
                name: ${serviceName}
                port:
                  number: ${servicePort}`;
  });

  return yaml;
}

function generateServiceYaml(data: ServiceNodeData, connectedDeployments: DeploymentNodeData[]): string {
  const selectorLabels = data.selectorLabels.length > 0 
    ? data.selectorLabels 
    : connectedDeployments[0]?.labels || [{ key: 'app', value: data.serviceName }];

  let yaml = `apiVersion: v1
kind: Service
metadata:
  name: ${data.serviceName}
spec:
  type: ${data.serviceType}
  ports:
    - port: ${data.port}
      targetPort: ${data.targetPort}
      protocol: TCP
  selector:`;

  selectorLabels.forEach(l => {
    yaml += `\n    ${l.key}: ${l.value}`;
  });

  return yaml;
}

function generateDeploymentYaml(
  data: DeploymentNodeData, 
  connectedConfigMaps: ConfigMapNodeData[],
  connectedSecrets: SecretNodeData[],
  connectedPVCs: PVCNodeData[]
): string {
  let yaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${data.deploymentName}
  labels:`;

  data.labels.forEach(l => {
    yaml += `\n    ${l.key}: ${l.value}`;
  });

  yaml += `
spec:
  replicas: ${data.replicas}
  selector:
    matchLabels:`;

  data.labels.forEach(l => {
    yaml += `\n      ${l.key}: ${l.value}`;
  });

  yaml += `
  template:
    metadata:
      labels:`;

  data.labels.forEach(l => {
    yaml += `\n        ${l.key}: ${l.value}`;
  });

  yaml += `
    spec:
      containers:
        - name: ${data.containerName}
          image: ${data.image}
          ports:
            - containerPort: ${data.containerPort}`;

  // Add env vars
  const allEnvVars = [...data.envVars];
  
  if (allEnvVars.length > 0 || connectedConfigMaps.length > 0 || connectedSecrets.length > 0) {
    if (allEnvVars.length > 0) {
      yaml += `
          env:`;
      allEnvVars.forEach(e => {
        yaml += `
            - name: ${e.key}
              value: "${e.value}"`;
      });
    }

    if (connectedConfigMaps.length > 0 || connectedSecrets.length > 0) {
      yaml += `
          envFrom:`;
      connectedConfigMaps.forEach(cm => {
        yaml += `
            - configMapRef:
                name: ${cm.name}`;
      });
      connectedSecrets.forEach(s => {
        yaml += `
            - secretRef:
                name: ${s.name}`;
      });
    }
  }

  // Add volume mounts
  if (connectedPVCs.length > 0) {
    yaml += `
          volumeMounts:`;
    connectedPVCs.forEach((pvc, i) => {
      yaml += `
            - name: ${pvc.name}-volume
              mountPath: /data/${pvc.name}`;
    });

    yaml += `
      volumes:`;
    connectedPVCs.forEach(pvc => {
      yaml += `
        - name: ${pvc.name}-volume
          persistentVolumeClaim:
            claimName: ${pvc.name}`;
    });
  }

  return yaml;
}

function generateConfigMapYaml(data: ConfigMapNodeData): string {
  let yaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${data.name}
data:`;

  data.data.forEach(d => {
    yaml += `\n  ${d.key}: "${d.value}"`;
  });

  return yaml;
}

function generateSecretYaml(data: SecretNodeData): string {
  let yaml = `apiVersion: v1
kind: Secret
metadata:
  name: ${data.name}
type: ${data.secretType}
data:`;

  data.data.forEach(d => {
    const encoded = btoa(d.value);
    yaml += `\n  ${d.key}: ${encoded}`;
  });

  return yaml;
}

function generatePVCYaml(data: PVCNodeData): string {
  return `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${data.name}
spec:
  storageClassName: ${data.storageClassName}
  accessModes:
${data.accessModes.map(m => `    - ${m}`).join('\n')}
  resources:
    requests:
      storage: ${data.size}`;
}

function generateCronJobYaml(data: CronJobNodeData): string {
  return `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${data.name}
spec:
  schedule: "${data.schedule}"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: ${data.name}
              image: ${data.image}
              command: ${JSON.stringify(data.command)}
              args: ${JSON.stringify(data.args)}
          restartPolicy: OnFailure`;
}

function generateHPAYaml(data: HPANodeData): string {
  return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${data.name}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${data.targetDeployment || 'my-deployment'}
  minReplicas: ${data.minReplicas}
  maxReplicas: ${data.maxReplicas}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${data.cpuTarget}`;
}

export function generateYamlFromGraph(nodes: Node<K8sNodeData>[], edges: Edge[]): GeneratedYaml {
  const result: GeneratedYaml = {
    ingresses: [],
    services: [],
    deployments: [],
    configmaps: [],
    secrets: [],
    pvcs: [],
    cronjobs: [],
    hpas: [],
  };

  nodes.forEach(node => {
    const data = node.data;
    
    switch (data.type) {
      case 'ingress': {
        const connectedServices = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'service')
          .map(n => n.data as ServiceNodeData);
        result.ingresses.push(generateIngressYaml(data, connectedServices));
        break;
      }
      case 'service': {
        const connectedDeployments = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'deployment')
          .map(n => n.data as DeploymentNodeData);
        result.services.push(generateServiceYaml(data, connectedDeployments));
        break;
      }
      case 'deployment': {
        const connectedConfigMaps = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'configmap')
          .map(n => n.data as ConfigMapNodeData);
        const connectedSecrets = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'secret')
          .map(n => n.data as SecretNodeData);
        const connectedPVCs = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'pvc')
          .map(n => n.data as PVCNodeData);
        result.deployments.push(generateDeploymentYaml(data, connectedConfigMaps, connectedSecrets, connectedPVCs));
        break;
      }
      case 'configmap':
        result.configmaps.push(generateConfigMapYaml(data));
        break;
      case 'secret':
        result.secrets.push(generateSecretYaml(data));
        break;
      case 'pvc':
        result.pvcs.push(generatePVCYaml(data));
        break;
      case 'cronjob':
        result.cronjobs.push(generateCronJobYaml(data));
        break;
      case 'hpa':
        result.hpas.push(generateHPAYaml(data));
        break;
    }
  });

  return result;
}

export function combineYamls(yamls: GeneratedYaml): string {
  const all = [
    ...yamls.configmaps,
    ...yamls.secrets,
    ...yamls.pvcs,
    ...yamls.deployments,
    ...yamls.services,
    ...yamls.ingresses,
    ...yamls.cronjobs,
    ...yamls.hpas,
  ];
  return all.join('\n---\n');
}
