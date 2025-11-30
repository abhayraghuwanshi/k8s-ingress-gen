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
  PodNodeData,
  SidecarNodeData,
  GeneratedYaml
} from '@/types/k8s';
import {
  getCloudProviderTemplate,
  generateAnnotationsFromTemplate,
  generateLabelsFromTemplate,
} from './cloudProviderTemplates';

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
  connectedPVCs: PVCNodeData[],
  connectedSidecars: SidecarNodeData[] = []
): string {
  let yaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${data.deploymentName}`;

  // Add cloud provider annotations if template is selected
  const cloudAnnotations = data.cloudProviderTemplateId && data.cloudProviderFields
    ? (() => {
        const template = getCloudProviderTemplate(data.cloudProviderTemplateId);
        return template ? generateAnnotationsFromTemplate(template, data.cloudProviderFields) : [];
      })()
    : data.annotations || [];

  if (cloudAnnotations.length > 0) {
    yaml += `\n  annotations:`;
    cloudAnnotations.forEach(a => {
      yaml += `\n    ${a.key}: "${a.value}"`;
    });
  }

  yaml += `\n  labels:`;

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
    spec:`;

  // Add init containers (sidecars with containerType: 'init')
  const initContainers = connectedSidecars.filter(s => s.containerType === 'init');
  if (initContainers.length > 0) {
    yaml += `
      initContainers:`;
    initContainers.forEach(sidecar => {
      yaml += `
        - name: ${sidecar.containerName}
          image: ${sidecar.image}`;

      if (sidecar.command && sidecar.command.length > 0) {
        yaml += `
          command:`;
        sidecar.command.forEach(cmd => {
          yaml += `
            - "${cmd}"`;
        });
      }

      if (sidecar.args && sidecar.args.length > 0) {
        yaml += `
          args:`;
        sidecar.args.forEach(arg => {
          yaml += `
            - "${arg}"`;
        });
      }

      if (sidecar.envVars.length > 0) {
        yaml += `
          env:`;
        sidecar.envVars.forEach(e => {
          yaml += `
            - name: ${e.key}
              value: "${e.value}"`;
        });
      }

      if (sidecar.volumeMounts && sidecar.volumeMounts.length > 0) {
        yaml += `
          volumeMounts:`;
        sidecar.volumeMounts.forEach(mount => {
          yaml += `
            - name: ${mount}
              mountPath: /mnt/${mount}`;
        });
      }
    });
  }

  yaml += `
      containers:
        - name: ${data.containerName}
          image: ${data.image}
          ports:
            - containerPort: ${data.containerPort}`;

  // Add resource requests and limits from cloud provider fields
  if (data.cloudProviderFields) {
    const { cpuRequest, memoryRequest, cpuLimit, memoryLimit } = data.cloudProviderFields;
    if (cpuRequest || memoryRequest || cpuLimit || memoryLimit) {
      yaml += `
          resources:`;
      if (cpuRequest || memoryRequest) {
        yaml += `
            requests:`;
        if (cpuRequest) yaml += `
              cpu: ${cpuRequest}`;
        if (memoryRequest) yaml += `
              memory: ${memoryRequest}`;
      }
      if (cpuLimit || memoryLimit) {
        yaml += `
            limits:`;
        if (cpuLimit) yaml += `
              cpu: ${cpuLimit}`;
        if (memoryLimit) yaml += `
              memory: ${memoryLimit}`;
      }
    }
  }

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
  }

  // Add regular sidecar containers (not init containers)
  const regularSidecars = connectedSidecars.filter(s => s.containerType === 'sidecar');
  if (regularSidecars.length > 0) {
    regularSidecars.forEach(sidecar => {
      yaml += `
        - name: ${sidecar.containerName}
          image: ${sidecar.image}`;

      if (sidecar.containerPort) {
        yaml += `
          ports:
            - containerPort: ${sidecar.containerPort}`;
      }

      if (sidecar.command && sidecar.command.length > 0) {
        yaml += `
          command:`;
        sidecar.command.forEach(cmd => {
          yaml += `
            - "${cmd}"`;
        });
      }

      if (sidecar.args && sidecar.args.length > 0) {
        yaml += `
          args:`;
        sidecar.args.forEach(arg => {
          yaml += `
            - "${arg}"`;
        });
      }

      if (sidecar.envVars.length > 0) {
        yaml += `
          env:`;
        sidecar.envVars.forEach(e => {
          yaml += `
            - name: ${e.key}
              value: "${e.value}"`;
        });
      }

      if (sidecar.volumeMounts && sidecar.volumeMounts.length > 0) {
        yaml += `
          volumeMounts:`;
        sidecar.volumeMounts.forEach(mount => {
          yaml += `
            - name: ${mount}
              mountPath: /mnt/${mount}`;
        });
      }
    });
  }

  // Add volumes
  if (connectedPVCs.length > 0) {
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
  name: ${data.name}`;

  // Add cloud provider annotations if template is selected
  const cloudAnnotations = data.cloudProviderTemplateId && data.cloudProviderFields
    ? (() => {
        const template = getCloudProviderTemplate(data.cloudProviderTemplateId);
        return template ? generateAnnotationsFromTemplate(template, data.cloudProviderFields) : [];
      })()
    : data.annotations || [];

  if (cloudAnnotations.length > 0) {
    yaml += `\n  annotations:`;
    cloudAnnotations.forEach(a => {
      yaml += `\n    ${a.key}: "${a.value}"`;
    });
  }

  yaml += `
type: ${data.secretType}
data:`;

  data.data.forEach(d => {
    const encoded = btoa(d.value);
    yaml += `\n  ${d.key}: ${encoded}`;
  });

  return yaml;
}

function generatePVCYaml(data: PVCNodeData): string {
  let yaml = `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${data.name}`;

  // Add cloud provider annotations if template is selected
  const cloudAnnotations = data.cloudProviderTemplateId && data.cloudProviderFields
    ? (() => {
        const template = getCloudProviderTemplate(data.cloudProviderTemplateId);
        return template ? generateAnnotationsFromTemplate(template, data.cloudProviderFields) : [];
      })()
    : data.annotations || [];

  if (cloudAnnotations.length > 0) {
    yaml += `\n  annotations:`;
    cloudAnnotations.forEach(a => {
      yaml += `\n    ${a.key}: "${a.value}"`;
    });
  }

  yaml += `
spec:
  storageClassName: ${data.storageClassName}
  accessModes:
${data.accessModes.map(m => `    - ${m}`).join('\n')}
  resources:
    requests:
      storage: ${data.size}`;

  return yaml;
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

function generatePodYaml(
  data: PodNodeData,
  connectedConfigMaps: ConfigMapNodeData[],
  connectedSecrets: SecretNodeData[],
  connectedPVCs: PVCNodeData[],
  connectedSidecars: SidecarNodeData[] = []
): string {
  let yaml = `apiVersion: v1
kind: Pod
metadata:
  name: ${data.name}
spec:`;

  // Add init containers (sidecars with containerType: 'init')
  const initContainers = connectedSidecars.filter(s => s.containerType === 'init');
  if (initContainers.length > 0) {
    yaml += `
  initContainers:`;
    initContainers.forEach(sidecar => {
      yaml += `
    - name: ${sidecar.containerName}
      image: ${sidecar.image}`;

      if (sidecar.command && sidecar.command.length > 0) {
        yaml += `
      command:`;
        sidecar.command.forEach(cmd => {
          yaml += `
        - "${cmd}"`;
        });
      }

      if (sidecar.args && sidecar.args.length > 0) {
        yaml += `
      args:`;
        sidecar.args.forEach(arg => {
          yaml += `
        - "${arg}"`;
        });
      }

      if (sidecar.envVars.length > 0) {
        yaml += `
      env:`;
        sidecar.envVars.forEach(e => {
          yaml += `
        - name: ${e.key}
          value: "${e.value}"`;
        });
      }

      if (sidecar.volumeMounts && sidecar.volumeMounts.length > 0) {
        yaml += `
      volumeMounts:`;
        sidecar.volumeMounts.forEach(mount => {
          yaml += `
        - name: ${mount}
          mountPath: /mnt/${mount}`;
        });
      }
    });
  }

  yaml += `
  containers:
    - name: ${data.name}
      image: ${data.image}
      ports:
        - containerPort: ${data.containerPort}`;

  // Add ConfigMaps and Secrets as env sources
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

  // Add volume mounts
  if (connectedPVCs.length > 0) {
    yaml += `
      volumeMounts:`;
    connectedPVCs.forEach((pvc) => {
      yaml += `
        - name: ${pvc.name}-volume
          mountPath: /data/${pvc.name}`;
    });
  }

  // Add regular sidecar containers (not init containers)
  const regularSidecars = connectedSidecars.filter(s => s.containerType === 'sidecar');
  if (regularSidecars.length > 0) {
    regularSidecars.forEach(sidecar => {
      yaml += `
    - name: ${sidecar.containerName}
      image: ${sidecar.image}`;

      if (sidecar.containerPort) {
        yaml += `
      ports:
        - containerPort: ${sidecar.containerPort}`;
      }

      if (sidecar.command && sidecar.command.length > 0) {
        yaml += `
      command:`;
        sidecar.command.forEach(cmd => {
          yaml += `
        - "${cmd}"`;
        });
      }

      if (sidecar.args && sidecar.args.length > 0) {
        yaml += `
      args:`;
        sidecar.args.forEach(arg => {
          yaml += `
        - "${arg}"`;
        });
      }

      if (sidecar.envVars.length > 0) {
        yaml += `
      env:`;
        sidecar.envVars.forEach(e => {
          yaml += `
        - name: ${e.key}
          value: "${e.value}"`;
        });
      }

      if (sidecar.volumeMounts && sidecar.volumeMounts.length > 0) {
        yaml += `
      volumeMounts:`;
        sidecar.volumeMounts.forEach(mount => {
          yaml += `
        - name: ${mount}
          mountPath: /mnt/${mount}`;
        });
      }
    });
  }

  // Add volumes
  if (connectedPVCs.length > 0) {
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
    pods: [],
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
        const connectedSidecars = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'sidecar')
          .map(n => n.data as SidecarNodeData);
        result.deployments.push(generateDeploymentYaml(data, connectedConfigMaps, connectedSecrets, connectedPVCs, connectedSidecars));
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
      case 'pod': {
        const connectedConfigMaps = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'configmap')
          .map(n => n.data as ConfigMapNodeData);
        const connectedSecrets = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'secret')
          .map(n => n.data as SecretNodeData);
        const connectedPVCs = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'pvc')
          .map(n => n.data as PVCNodeData);
        const connectedSidecars = getConnectedNodes(node.id, edges, nodes, 'source')
          .filter(n => n.data.type === 'sidecar')
          .map(n => n.data as SidecarNodeData);
        result.pods.push(generatePodYaml(data, connectedConfigMaps, connectedSecrets, connectedPVCs, connectedSidecars));
        break;
      }
    }
  });

  return result;
}

export function combineYamls(yamls: GeneratedYaml): string {
  const all = [
    ...yamls.configmaps,
    ...yamls.secrets,
    ...yamls.pvcs,
    ...yamls.pods,
    ...yamls.deployments,
    ...yamls.services,
    ...yamls.ingresses,
    ...yamls.cronjobs,
    ...yamls.hpas,
  ];
  return all.join('\n---\n');
}
