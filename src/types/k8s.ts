export type K8sNodeType = 
  | 'ingress' 
  | 'service' 
  | 'deployment' 
  | 'configmap' 
  | 'secret' 
  | 'pvc' 
  | 'cronjob' 
  | 'hpa'
  | 'pod';

export interface KeyValue {
  key: string;
  value: string;
}

export interface IngressPath {
  path: string;
  pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
  serviceName: string;
  servicePort: number;
}

export interface IngressNodeData {
  type: 'ingress';
  label: string;
  host: string;
  paths: IngressPath[];
  ingressClassName: string;
  enableTLS: boolean;
  tlsSecretName: string;
  annotations: KeyValue[];
}

export interface ServiceNodeData {
  type: 'service';
  label: string;
  serviceName: string;
  port: number;
  targetPort: number;
  serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  selectorLabels: KeyValue[];
}

export interface DeploymentNodeData {
  type: 'deployment';
  label: string;
  deploymentName: string;
  replicas: number;
  containerName: string;
  image: string;
  containerPort: number;
  envVars: KeyValue[];
  labels: KeyValue[];
  volumeMounts: string[];
}

export interface ConfigMapNodeData {
  type: 'configmap';
  label: string;
  name: string;
  data: KeyValue[];
}

export interface SecretNodeData {
  type: 'secret';
  label: string;
  name: string;
  secretType: 'Opaque' | 'kubernetes.io/tls';
  data: KeyValue[];
}

export interface PVCNodeData {
  type: 'pvc';
  label: string;
  name: string;
  storageClassName: string;
  size: string;
  accessModes: ('ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany')[];
}

export interface CronJobNodeData {
  type: 'cronjob';
  label: string;
  name: string;
  schedule: string;
  image: string;
  command: string[];
  args: string[];
}

export interface HPANodeData {
  type: 'hpa';
  label: string;
  name: string;
  targetDeployment: string;
  minReplicas: number;
  maxReplicas: number;
  cpuTarget: number;
}

export interface PodNodeData {
  type: 'pod';
  label: string;
  name: string;
  image: string;
  containerPort: number;
}

export type K8sNodeData = 
  | IngressNodeData 
  | ServiceNodeData 
  | DeploymentNodeData 
  | ConfigMapNodeData 
  | SecretNodeData 
  | PVCNodeData 
  | CronJobNodeData 
  | HPANodeData
  | PodNodeData;

export interface GeneratedYaml {
  ingresses: string[];
  services: string[];
  deployments: string[];
  configmaps: string[];
  secrets: string[];
  pvcs: string[];
  cronjobs: string[];
  hpas: string[];
}

export const defaultNodeData: Record<K8sNodeType, () => K8sNodeData> = {
  ingress: () => ({
    type: 'ingress',
    label: 'Ingress',
    host: 'example.com',
    paths: [{ path: '/', pathType: 'Prefix', serviceName: '', servicePort: 80 }],
    ingressClassName: 'nginx',
    enableTLS: false,
    tlsSecretName: '',
    annotations: [],
  }),
  service: () => ({
    type: 'service',
    label: 'Service',
    serviceName: 'my-service',
    port: 80,
    targetPort: 8080,
    serviceType: 'ClusterIP',
    selectorLabels: [{ key: 'app', value: 'my-app' }],
  }),
  deployment: () => ({
    type: 'deployment',
    label: 'Deployment',
    deploymentName: 'my-deployment',
    replicas: 1,
    containerName: 'main',
    image: 'nginx:latest',
    containerPort: 80,
    envVars: [],
    labels: [{ key: 'app', value: 'my-app' }],
    volumeMounts: [],
  }),
  configmap: () => ({
    type: 'configmap',
    label: 'ConfigMap',
    name: 'my-config',
    data: [{ key: 'CONFIG_KEY', value: 'config-value' }],
  }),
  secret: () => ({
    type: 'secret',
    label: 'Secret',
    name: 'my-secret',
    secretType: 'Opaque',
    data: [{ key: 'SECRET_KEY', value: 'secret-value' }],
  }),
  pvc: () => ({
    type: 'pvc',
    label: 'PVC',
    name: 'my-pvc',
    storageClassName: 'standard',
    size: '1Gi',
    accessModes: ['ReadWriteOnce'],
  }),
  cronjob: () => ({
    type: 'cronjob',
    label: 'CronJob',
    name: 'my-cronjob',
    schedule: '*/5 * * * *',
    image: 'busybox:latest',
    command: ['/bin/sh', '-c'],
    args: ['echo "Hello from CronJob"'],
  }),
  hpa: () => ({
    type: 'hpa',
    label: 'HPA',
    name: 'my-hpa',
    targetDeployment: '',
    minReplicas: 1,
    maxReplicas: 10,
    cpuTarget: 80,
  }),
  pod: () => ({
    type: 'pod',
    label: 'Pod',
    name: 'my-pod',
    image: 'nginx:latest',
    containerPort: 80,
  }),
};
