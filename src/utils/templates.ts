import { Node, Edge } from 'reactflow';
import { K8sNodeData } from '@/types/k8s';

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Node<K8sNodeData>[];
  edges: Edge[];
}

export const templates: DiagramTemplate[] = [
  {
    id: 'simple-app',
    name: 'Simple App',
    description: 'Ingress → Service → Deployment',
    nodes: [
      {
        id: 'ingress-1',
        type: 'k8sNode',
        position: { x: 100, y: 100 },
        data: {
          type: 'ingress',
          label: 'Web Ingress',
          host: 'myapp.example.com',
          paths: [{ path: '/', pathType: 'Prefix', serviceName: '', servicePort: 80 }],
          ingressClassName: 'nginx',
          enableTLS: false,
          tlsSecretName: '',
          annotations: [],
        },
      },
      {
        id: 'service-1',
        type: 'k8sNode',
        position: { x: 100, y: 250 },
        data: {
          type: 'service',
          label: 'Web Service',
          serviceName: 'web-service',
          port: 80,
          targetPort: 8080,
          serviceType: 'ClusterIP',
          selectorLabels: [{ key: 'app', value: 'web' }],
        },
      },
      {
        id: 'deployment-1',
        type: 'k8sNode',
        position: { x: 100, y: 400 },
        data: {
          type: 'deployment',
          label: 'Web Deployment',
          deploymentName: 'web-deployment',
          replicas: 1,
          containerName: 'web',
          image: 'nginx:alpine',
          containerPort: 80,
          envVars: [],
          labels: [{ key: 'app', value: 'web' }],
          volumeMounts: [],
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'ingress-1', target: 'service-1' },
      { id: 'e2-3', source: 'service-1', target: 'deployment-1' },
    ],
  },
  {
    id: 'multi-path',
    name: 'Multi-Path App',
    description: 'Ingress → Multiple Services',
    nodes: [
      {
        id: 'ingress-1',
        type: 'k8sNode',
        position: { x: 200, y: 50 },
        data: {
          type: 'ingress',
          label: 'API Gateway',
          host: 'api.example.com',
          paths: [
            { path: '/api', pathType: 'Prefix', serviceName: 'api-service', servicePort: 80 },
            { path: '/web', pathType: 'Prefix', serviceName: 'web-service', servicePort: 80 },
          ],
          ingressClassName: 'nginx',
          enableTLS: false,
          tlsSecretName: '',
          annotations: [],
        },
      },
      {
        id: 'service-api',
        type: 'k8sNode',
        position: { x: 50, y: 200 },
        data: {
          type: 'service',
          label: 'API Service',
          serviceName: 'api-service',
          port: 80,
          targetPort: 3000,
          serviceType: 'ClusterIP',
          selectorLabels: [{ key: 'app', value: 'api' }],
        },
      },
      {
        id: 'service-web',
        type: 'k8sNode',
        position: { x: 350, y: 200 },
        data: {
          type: 'service',
          label: 'Web Service',
          serviceName: 'web-service',
          port: 80,
          targetPort: 80,
          serviceType: 'ClusterIP',
          selectorLabels: [{ key: 'app', value: 'web' }],
        },
      },
      {
        id: 'deployment-api',
        type: 'k8sNode',
        position: { x: 50, y: 350 },
        data: {
          type: 'deployment',
          label: 'API Deployment',
          deploymentName: 'api-deployment',
          replicas: 2,
          containerName: 'api',
          image: 'node:18-alpine',
          containerPort: 3000,
          envVars: [],
          labels: [{ key: 'app', value: 'api' }],
          volumeMounts: [],
        },
      },
      {
        id: 'deployment-web',
        type: 'k8sNode',
        position: { x: 350, y: 350 },
        data: {
          type: 'deployment',
          label: 'Web Deployment',
          deploymentName: 'web-deployment',
          replicas: 2,
          containerName: 'web',
          image: 'nginx:alpine',
          containerPort: 80,
          envVars: [],
          labels: [{ key: 'app', value: 'web' }],
          volumeMounts: [],
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'ingress-1', target: 'service-api' },
      { id: 'e2', source: 'ingress-1', target: 'service-web' },
      { id: 'e3', source: 'service-api', target: 'deployment-api' },
      { id: 'e4', source: 'service-web', target: 'deployment-web' },
    ],
  },
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Full stack with ConfigMap & Secret',
    nodes: [
      {
        id: 'ingress-1',
        type: 'k8sNode',
        position: { x: 300, y: 50 },
        data: {
          type: 'ingress',
          label: 'Main Ingress',
          host: 'app.example.com',
          paths: [{ path: '/', pathType: 'Prefix', serviceName: 'backend-service', servicePort: 80 }],
          ingressClassName: 'nginx',
          enableTLS: true,
          tlsSecretName: 'tls-secret',
          annotations: [],
        },
      },
      {
        id: 'service-1',
        type: 'k8sNode',
        position: { x: 300, y: 180 },
        data: {
          type: 'service',
          label: 'Backend Service',
          serviceName: 'backend-service',
          port: 80,
          targetPort: 8080,
          serviceType: 'ClusterIP',
          selectorLabels: [{ key: 'app', value: 'backend' }],
        },
      },
      {
        id: 'deployment-1',
        type: 'k8sNode',
        position: { x: 300, y: 320 },
        data: {
          type: 'deployment',
          label: 'Backend',
          deploymentName: 'backend',
          replicas: 3,
          containerName: 'backend',
          image: 'myapp/backend:latest',
          containerPort: 8080,
          envVars: [],
          labels: [{ key: 'app', value: 'backend' }],
          volumeMounts: [],
        },
      },
      {
        id: 'configmap-1',
        type: 'k8sNode',
        position: { x: 50, y: 450 },
        data: {
          type: 'configmap',
          label: 'App Config',
          name: 'app-config',
          data: [
            { key: 'DATABASE_HOST', value: 'postgres.default.svc' },
            { key: 'REDIS_HOST', value: 'redis.default.svc' },
          ],
        },
      },
      {
        id: 'secret-1',
        type: 'k8sNode',
        position: { x: 300, y: 500 },
        data: {
          type: 'secret',
          label: 'DB Credentials',
          name: 'db-credentials',
          secretType: 'Opaque',
          data: [
            { key: 'DB_USER', value: 'admin' },
            { key: 'DB_PASSWORD', value: 'supersecret' },
          ],
        },
      },
      {
        id: 'pvc-1',
        type: 'k8sNode',
        position: { x: 550, y: 450 },
        data: {
          type: 'pvc',
          label: 'Data Volume',
          name: 'data-pvc',
          storageClassName: 'standard',
          size: '10Gi',
          accessModes: ['ReadWriteOnce'],
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'ingress-1', target: 'service-1' },
      { id: 'e2', source: 'service-1', target: 'deployment-1' },
      { id: 'e3', source: 'deployment-1', target: 'configmap-1' },
      { id: 'e4', source: 'deployment-1', target: 'secret-1' },
      { id: 'e5', source: 'deployment-1', target: 'pvc-1' },
    ],
  },
  {
    id: 'cronjob-system',
    name: 'CronJob System',
    description: 'Scheduled jobs with configuration',
    nodes: [
      {
        id: 'cronjob-1',
        type: 'k8sNode',
        position: { x: 200, y: 100 },
        data: {
          type: 'cronjob',
          label: 'Backup Job',
          name: 'backup-cronjob',
          schedule: '0 2 * * *',
          image: 'backup-tool:latest',
          command: ['/bin/sh', '-c'],
          args: ['backup.sh'],
        },
      },
      {
        id: 'configmap-1',
        type: 'k8sNode',
        position: { x: 50, y: 280 },
        data: {
          type: 'configmap',
          label: 'Backup Config',
          name: 'backup-config',
          data: [
            { key: 'BACKUP_PATH', value: '/data/backup' },
            { key: 'RETENTION_DAYS', value: '30' },
          ],
        },
      },
      {
        id: 'secret-1',
        type: 'k8sNode',
        position: { x: 350, y: 280 },
        data: {
          type: 'secret',
          label: 'S3 Credentials',
          name: 's3-credentials',
          secretType: 'Opaque',
          data: [
            { key: 'AWS_ACCESS_KEY', value: 'AKIAIOSFODNN7' },
            { key: 'AWS_SECRET_KEY', value: 'secret123' },
          ],
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'cronjob-1', target: 'configmap-1' },
      { id: 'e2', source: 'cronjob-1', target: 'secret-1' },
    ],
  },
];
