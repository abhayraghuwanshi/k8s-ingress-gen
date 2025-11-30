/**
 * Field Help Documentation
 * Provides contextual help, examples, and validation guidance for all K8s resource fields
 */

export interface FieldHelp {
  description: string;
  example?: string;
  validationRules?: string;
  learnMore?: string;
}

export const fieldHelp: Record<string, FieldHelp> = {
  // Common fields
  label: {
    description: "Display name for this resource in the diagram",
    example: "My API Service, Backend Deployment",
    validationRules: "Any descriptive text"
  },

  // Ingress fields
  'ingress.host': {
    description: "Domain name for your application",
    example: "api.example.com, myapp.com, *.example.com",
    validationRules: "Valid domain name or wildcard domain",
    learnMore: "This is the domain users will access your app from"
  },
  'ingress.ingressClassName': {
    description: "Ingress controller to use for routing traffic",
    example: "nginx, traefik, istio",
    validationRules: "Must match an installed ingress controller",
    learnMore: "Common: nginx for most apps, traefik for microservices, istio for service mesh"
  },
  'ingress.enableTLS': {
    description: "Enable HTTPS/SSL for secure connections",
    learnMore: "Requires a TLS secret with certificate and private key"
  },
  'ingress.tlsSecretName': {
    description: "Name of the secret containing TLS certificate",
    example: "tls-secret, myapp-tls",
    validationRules: "Must reference an existing secret",
    learnMore: "Create a secret with tls.crt and tls.key"
  },
  'ingress.annotations': {
    description: "Additional configuration for the ingress controller",
    example: "nginx.ingress.kubernetes.io/rewrite-target: /",
    learnMore: "Controller-specific settings for SSL, redirects, rate limiting, etc."
  },

  // Service fields
  'service.serviceName': {
    description: "Unique name for this service in the namespace",
    example: "api-service, backend-svc, web",
    validationRules: "Lowercase alphanumeric with hyphens, DNS-1123 compliant",
    learnMore: "Used by other resources to reference this service"
  },
  'service.port': {
    description: "Port exposed by the service (external)",
    example: "80 (HTTP), 443 (HTTPS), 3000",
    validationRules: "1-65535",
    learnMore: "Port that clients connect to"
  },
  'service.targetPort': {
    description: "Port on the pod container (internal)",
    example: "8080, 3000, 5000",
    validationRules: "Must match container port",
    learnMore: "Port your application listens on inside the container"
  },
  'service.serviceType': {
    description: "How the service is exposed",
    example: "ClusterIP: internal only\nNodePort: accessible on node IPs\nLoadBalancer: cloud load balancer",
    learnMore: "ClusterIP for internal, LoadBalancer for production external access"
  },
  'service.selectorLabels': {
    description: "Labels to select which pods receive traffic",
    example: "app: backend, version: v1",
    validationRules: "Must match deployment/pod labels exactly",
    learnMore: "Service routes traffic to pods with matching labels"
  },

  // Deployment fields
  'deployment.deploymentName': {
    description: "Unique name for this deployment",
    example: "backend-deployment, api-deploy",
    validationRules: "Lowercase alphanumeric with hyphens",
    learnMore: "Manages pod replicas and rolling updates"
  },
  'deployment.replicas': {
    description: "Number of pod copies to run",
    example: "1 (dev), 3 (prod), 5+ (high traffic)",
    validationRules: "Positive integer",
    learnMore: "More replicas = higher availability and capacity"
  },
  'deployment.containerName': {
    description: "Name for the container in the pod",
    example: "app, backend, nginx",
    validationRules: "Lowercase alphanumeric with hyphens"
  },
  'deployment.image': {
    description: "Docker image to run",
    example: "nginx:alpine, node:18, myregistry.io/app:v1.2.3",
    validationRules: "Valid Docker image reference",
    learnMore: "Format: [registry/]image[:tag]. Use specific tags in production, avoid :latest"
  },
  'deployment.containerPort': {
    description: "Port the application listens on inside container",
    example: "80 (nginx), 3000 (node), 8080 (java)",
    validationRules: "Must match your app's listening port",
    learnMore: "This should match the targetPort in your Service"
  },
  'deployment.labels': {
    description: "Labels for pod identification and selection",
    example: "app: backend, tier: api, env: prod",
    validationRules: "Key-value pairs, alphanumeric",
    learnMore: "Services use these labels to find pods"
  },
  'deployment.envVars': {
    description: "Environment variables for the container",
    example: "NODE_ENV: production, API_URL: https://api.com",
    learnMore: "Can reference ConfigMaps and Secrets for values"
  },

  // ConfigMap fields
  'configmap.name': {
    description: "Unique name for this config map",
    example: "app-config, backend-settings",
    validationRules: "Lowercase alphanumeric with hyphens"
  },
  'configmap.data': {
    description: "Non-sensitive configuration data",
    example: "DATABASE_HOST: postgres.default.svc\nLOG_LEVEL: info",
    validationRules: "Plain text key-value pairs",
    learnMore: "Use for config files, settings, non-secret data"
  },

  // Secret fields
  'secret.name': {
    description: "Unique name for this secret",
    example: "db-credentials, api-keys, tls-cert",
    validationRules: "Lowercase alphanumeric with hyphens"
  },
  'secret.secretType': {
    description: "Type of secret data",
    example: "Opaque: generic secrets\nkubernetes.io/tls: TLS certificates",
    learnMore: "Opaque for passwords/keys, kubernetes.io/tls for SSL certs"
  },
  'secret.data': {
    description: "Sensitive data (will be base64 encoded)",
    example: "DB_PASSWORD: mysecret123\nAPI_KEY: sk-abc123",
    validationRules: "Will be automatically base64 encoded",
    learnMore: "NEVER commit real secrets to version control!"
  },

  // PVC fields
  'pvc.name': {
    description: "Unique name for this persistent volume claim",
    example: "data-pvc, postgres-storage, uploads",
    validationRules: "Lowercase alphanumeric with hyphens"
  },
  'pvc.storageClassName': {
    description: "Type of storage to provision",
    example: "standard, fast, ssd, gp2 (AWS), pd-ssd (GCP)",
    validationRules: "Must match available storage classes",
    learnMore: "Different classes offer different performance/cost trade-offs"
  },
  'pvc.size': {
    description: "Amount of storage to request",
    example: "1Gi, 10Gi, 100Gi, 1Ti",
    validationRules: "Must include unit: Mi, Gi, Ti",
    learnMore: "Request what you need, storage can be expensive"
  },

  // CronJob fields
  'cronjob.name': {
    description: "Unique name for this cron job",
    example: "backup-job, cleanup-task, report-generator",
    validationRules: "Lowercase alphanumeric with hyphens"
  },
  'cronjob.schedule': {
    description: "When to run the job (cron format)",
    example: "*/5 * * * * (every 5 min)\n0 2 * * * (2am daily)\n0 0 * * 0 (weekly)",
    validationRules: "Standard cron syntax: minute hour day month weekday",
    learnMore: "Test your cron expression at crontab.guru"
  },
  'cronjob.image': {
    description: "Container image for the job",
    example: "backup-tool:latest, python:3.11, busybox",
    learnMore: "Job runs to completion then stops"
  },

  // HPA fields
  'hpa.name': {
    description: "Unique name for this autoscaler",
    example: "backend-hpa, api-autoscaler",
    validationRules: "Lowercase alphanumeric with hyphens"
  },
  'hpa.targetDeployment': {
    description: "Name of the deployment to scale",
    example: "backend-deployment, api-deploy",
    validationRules: "Must match an existing deployment name exactly",
    learnMore: "HPA automatically adjusts deployment replicas based on metrics"
  },
  'hpa.minReplicas': {
    description: "Minimum number of pods to maintain",
    example: "1 (dev), 2 (prod for HA)",
    validationRules: "Must be ≥ 1 and ≤ max replicas",
    learnMore: "Never scales below this number"
  },
  'hpa.maxReplicas': {
    description: "Maximum number of pods allowed",
    example: "5 (small), 10 (medium), 50+ (large scale)",
    validationRules: "Must be ≥ min replicas",
    learnMore: "Caps scaling to prevent runaway costs"
  },
  'hpa.cpuTarget': {
    description: "Target CPU utilization percentage",
    example: "50 (aggressive scaling), 80 (balanced), 90 (conservative)",
    validationRules: "1-100 percentage",
    learnMore: "HPA adds pods when average CPU exceeds this threshold"
  },

  // Pod fields
  'pod.name': {
    description: "Unique name for this pod",
    example: "debug-pod, test-pod",
    validationRules: "Lowercase alphanumeric with hyphens",
    learnMore: "Standalone pods (not managed by deployments)"
  },
  'pod.image': {
    description: "Docker image to run",
    example: "nginx:alpine, busybox, ubuntu:22.04"
  },
  'pod.containerPort': {
    description: "Port the container exposes",
    example: "80, 8080, 3000"
  },
};

/**
 * Get help text for a specific field
 */
export function getFieldHelp(fieldKey: string): FieldHelp | null {
  return fieldHelp[fieldKey] || null;
}

/**
 * Get example value for a field
 */
export function getFieldExample(fieldKey: string): string | null {
  const help = getFieldHelp(fieldKey);
  return help?.example || null;
}
