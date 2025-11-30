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

  // Cloud Provider fields
  'cloudProvider.selector': {
    description: "Select your cloud platform for optimized configurations",
    example: "AWS (EKS), Azure (AKS), GCP (GKE)",
    learnMore: "Each provider has specific annotations and features for storage, networking, and identity"
  },
  'cloudProvider.template': {
    description: "Pre-configured template for your cloud provider",
    learnMore: "Templates include best practices and common configurations for your selected cloud platform"
  },

  // AWS Cloud Provider fields
  'aws.deployment.containerRegistry': {
    description: "Container registry for your Docker images",
    example: "ECR (Amazon Elastic Container Registry) or Docker Hub",
    learnMore: "ECR integrates with IAM for secure image access"
  },
  'aws.deployment.ecrRepository': {
    description: "Full ECR repository URI",
    example: "123456789.dkr.ecr.us-east-1.amazonaws.com/my-app",
    validationRules: "Format: {account-id}.dkr.ecr.{region}.amazonaws.com/{repo-name}",
    learnMore: "Pull images from your private ECR repository"
  },
  'aws.deployment.iamRole': {
    description: "IAM role for pod service account (IRSA)",
    example: "arn:aws:iam::123456789:role/my-app-role",
    learnMore: "Use IAM roles for service accounts to grant AWS permissions to pods"
  },
  'aws.deployment.cpuRequest': {
    description: "CPU units to reserve for the pod",
    example: "100m (0.1 CPU), 500m (0.5 CPU), 1 (1 full CPU)",
    validationRules: "Millicores (m) or full cores",
    learnMore: "Guaranteed CPU allocation for your pod"
  },
  'aws.deployment.memoryRequest': {
    description: "Memory to reserve for the pod",
    example: "128Mi, 256Mi, 512Mi, 1Gi",
    validationRules: "Must include unit: Mi or Gi",
    learnMore: "Guaranteed memory allocation for your pod"
  },
  'aws.deployment.cpuLimit': {
    description: "Maximum CPU the pod can use",
    example: "500m, 1, 2",
    learnMore: "Pod will be throttled if it exceeds this limit"
  },
  'aws.deployment.memoryLimit': {
    description: "Maximum memory the pod can use",
    example: "512Mi, 1Gi, 2Gi",
    learnMore: "Pod will be killed if it exceeds this limit (OOMKilled)"
  },
  'aws.pvc.storageClass': {
    description: "AWS EBS volume type",
    example: "gp3 (general purpose SSD), io2 (high-performance SSD)",
    learnMore: "gp3 is recommended for most workloads with better price/performance"
  },
  'aws.pvc.volumeType': {
    description: "EBS volume type for provisioning",
    example: "gp3, gp2, io1, io2, st1, sc1",
    learnMore: "Different types offer different IOPS and throughput characteristics"
  },
  'aws.pvc.iops': {
    description: "Provisioned IOPS for the volume",
    example: "3000 (gp3 default), 10000 (high performance)",
    validationRules: "3000-16000 for gp3, higher for io1/io2",
    learnMore: "More IOPS = better I/O performance, costs more"
  },
  'aws.pvc.throughput': {
    description: "Throughput in MB/s for gp3 volumes",
    example: "125 (default), 250, 500, 1000",
    validationRules: "125-1000 MB/s for gp3",
    learnMore: "Higher throughput for sequential read/write workloads"
  },
  'aws.pvc.encrypted': {
    description: "Enable EBS encryption at rest",
    learnMore: "Recommended for security and compliance"
  },
  'aws.pvc.kmsKeyId': {
    description: "AWS KMS key for volume encryption",
    example: "arn:aws:kms:us-east-1:123456789:key/abcd-1234",
    learnMore: "Use custom KMS key for encryption control"
  },

  // Azure Cloud Provider fields
  'azure.deployment.containerRegistry': {
    description: "Container registry for Docker images",
    example: "ACR (Azure Container Registry) or Docker Hub",
    learnMore: "ACR integrates with Azure AD for authentication"
  },
  'azure.deployment.acrName': {
    description: "Azure Container Registry name",
    example: "myregistry.azurecr.io",
    validationRules: "Format: {registry-name}.azurecr.io",
    learnMore: "Pull images from your private ACR"
  },
  'azure.deployment.managedIdentity': {
    description: "Azure managed identity client ID",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    learnMore: "Use workload identity for Azure resource access"
  },
  'azure.deployment.useWorkloadIdentity': {
    description: "Enable Azure AD workload identity",
    learnMore: "Recommended for secure access to Azure resources"
  },
  'azure.pvc.storageClass': {
    description: "Azure disk storage class",
    example: "managed-csi (default), managed-csi-premium (SSD)",
    learnMore: "Premium SSD recommended for production databases"
  },
  'azure.pvc.skuName': {
    description: "Azure disk SKU/performance tier",
    example: "Standard_LRS, StandardSSD_LRS, Premium_LRS, UltraSSD_LRS",
    learnMore: "Higher SKUs offer better performance but cost more"
  },
  'azure.pvc.cachingMode': {
    description: "Host caching mode for the disk",
    example: "None, ReadOnly, ReadWrite",
    learnMore: "ReadOnly recommended for most workloads"
  },
  'azure.pvc.resourceGroup': {
    description: "Azure resource group for disk creation",
    example: "my-resource-group",
    learnMore: "Disk will be created in this resource group"
  },

  // GCP Cloud Provider fields
  'gcp.deployment.containerRegistry': {
    description: "Container registry for Docker images",
    example: "Artifact Registry (recommended), Container Registry (gcr.io)",
    learnMore: "Artifact Registry is the successor to Container Registry"
  },
  'gcp.deployment.artifactRegistryPath': {
    description: "Full Artifact Registry image path",
    example: "us-docker.pkg.dev/my-project/my-repo/my-app",
    validationRules: "Format: {region}-docker.pkg.dev/{project-id}/{repo}/{image}",
    learnMore: "Pull images from Artifact Registry"
  },
  'gcp.deployment.workloadIdentity': {
    description: "GCP service account for workload identity",
    example: "my-app@my-project.iam.gserviceaccount.com",
    learnMore: "Use workload identity for GCP API access"
  },
  'gcp.deployment.nodeSelector': {
    description: "GKE node pool selector",
    example: "cloud.google.com/gke-nodepool=default-pool",
    learnMore: "Schedule pods on specific node pools"
  },
  'gcp.pvc.storageClass': {
    description: "GCP persistent disk storage class",
    example: "standard-rwo (balanced), premium-rwo (SSD)",
    learnMore: "Premium-rwo recommended for high-performance workloads"
  },
  'gcp.pvc.diskType': {
    description: "GCE persistent disk type",
    example: "pd-standard, pd-balanced, pd-ssd, pd-extreme",
    learnMore: "pd-balanced offers good price/performance balance"
  },
  'gcp.pvc.replicationType': {
    description: "Disk replication configuration",
    example: "none (single zone), regional-pd (multi-zone)",
    learnMore: "Regional PD provides higher availability across zones"
  },
  'gcp.pvc.provisionedIops': {
    description: "Provisioned IOPS for pd-extreme disks",
    example: "10000, 50000, 100000",
    learnMore: "Only applicable for pd-extreme disk type"
  },

  // AWS Secret fields
  'aws.secret.secretProvider': {
    description: "AWS secret management service",
    example: "Secrets Manager (recommended), Parameter Store, External Secrets Operator",
    learnMore: "Secrets Manager provides automatic rotation, Parameter Store is simpler"
  },
  'aws.secret.secretsManagerArn': {
    description: "ARN of the secret in AWS Secrets Manager",
    example: "arn:aws:secretsmanager:us-east-1:123456789:secret:my-secret-abc123",
    validationRules: "Full ARN required for secret access",
    learnMore: "Grant IAM permissions to the pod service account"
  },
  'aws.secret.parameterStorePrefix': {
    description: "Path prefix for SSM Parameter Store parameters",
    example: "/myapp/prod/, /database/credentials/",
    learnMore: "Use hierarchical paths to organize parameters"
  },
  'aws.secret.rotationEnabled': {
    description: "Enable automatic secret rotation via Lambda",
    learnMore: "Requires a rotation Lambda function configured in Secrets Manager"
  },
  'aws.secret.region': {
    description: "AWS region where secrets are stored",
    example: "us-east-1, eu-west-1, ap-southeast-1",
    learnMore: "Must match the region of your secrets"
  },

  // Azure Secret fields
  'azure.secret.keyVaultName': {
    description: "Name of the Azure Key Vault",
    example: "my-keyvault, prod-secrets, app-vault",
    learnMore: "Key Vault must be in the same subscription"
  },
  'azure.secret.keyVaultUri': {
    description: "Full URI of the Azure Key Vault",
    example: "https://my-keyvault.vault.azure.net/",
    validationRules: "Format: https://{vault-name}.vault.azure.net/",
    learnMore: "Used by CSI driver to access vault"
  },
  'azure.secret.tenantId': {
    description: "Azure Active Directory tenant ID",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    learnMore: "Found in Azure AD properties in Azure Portal"
  },
  'azure.secret.usePodIdentity': {
    description: "Use Azure AD Pod Identity for authentication",
    learnMore: "Legacy method - prefer workload identity for new deployments"
  },
  'azure.secret.useWorkloadIdentity': {
    description: "Use Azure Workload Identity (recommended)",
    learnMore: "Modern, secure way to authenticate pods with Azure AD"
  },
  'azure.secret.cloudProviderClass': {
    description: "Method to sync secrets from Key Vault",
    example: "CSI driver (native), External Secrets Operator",
    learnMore: "CSI driver recommended for most use cases"
  },

  // GCP Secret fields
  'gcp.secret.projectId': {
    description: "Google Cloud project ID containing secrets",
    example: "my-project-123456, production-app-456789",
    learnMore: "Project must have Secret Manager API enabled"
  },
  'gcp.secret.secretName': {
    description: "Name of the secret in GCP Secret Manager",
    example: "database-password, api-key, tls-cert",
    learnMore: "Secret must exist in Secret Manager"
  },
  'gcp.secret.secretVersion': {
    description: "Version of the secret to use",
    example: "latest, 1, 5",
    learnMore: "Use 'latest' for automatic updates, or pin to specific version"
  },
  'gcp.secret.workloadIdentity': {
    description: "GCP service account with Secret Manager access",
    example: "my-app@my-project.iam.gserviceaccount.com",
    validationRules: "Requires roles/secretmanager.secretAccessor permission",
    learnMore: "Bind service account to Kubernetes service account"
  },
  'gcp.secret.useExternalSecrets': {
    description: "Use External Secrets Operator to sync secrets",
    learnMore: "ESO automatically syncs secrets from Secret Manager to K8s"
  },
  'gcp.secret.autoRotate': {
    description: "Automatically sync secret updates",
    learnMore: "When enabled, K8s secret updates when Secret Manager version changes"
  },

  // Sidecar fields
  'sidecar.containerName': {
    description: "Name of the sidecar container",
    example: "log-agent, proxy, xray-daemon, cloud-sql-proxy",
    validationRules: "Lowercase alphanumeric with hyphens",
    learnMore: "Sidecar runs alongside the main application container in the same pod"
  },
  'sidecar.image': {
    description: "Docker image for the sidecar container",
    example: "envoyproxy/envoy:v1.28-latest, amazon/aws-xray-daemon, fluent/fluent-bit",
    learnMore: "Common sidecars: Envoy (proxy), X-Ray (tracing), Fluent Bit (logging)"
  },
  'sidecar.purpose': {
    description: "Categorize the sidecar's function",
    example: "Logging: Fluent Bit, Filebeat\nMonitoring: Prometheus exporter, Datadog agent\nProxy: Envoy, Linkerd\nSecurity: Vault agent, policy enforcer",
    learnMore: "Helps organize and understand your sidecar architecture"
  },
  'sidecar.containerType': {
    description: "Whether to run as a sidecar or init container",
    example: "Sidecar: Runs alongside main app (Envoy proxy, log collector)\nInit: Runs before main app starts (setup, migrations, config fetching)",
    validationRules: "Sidecar for continuous processes, Init for one-time setup tasks",
    learnMore: "Init containers complete before the main app starts. Sidecars run concurrently with the main app."
  },
  'sidecar.containerPort': {
    description: "Port exposed by the sidecar (optional)",
    example: "2000 (X-Ray), 9901 (Envoy admin), 8125 (StatsD)",
    learnMore: "Not all sidecars need to expose ports"
  },
  'sidecar.envVars': {
    description: "Environment variables for sidecar configuration",
    example: "AWS_REGION: us-east-1, LOG_LEVEL: info, PROXY_PORT: 8080",
    learnMore: "Configure sidecar behavior without modifying the main app"
  },

  // AWS Sidecar fields
  'aws.sidecar.sidecarType': {
    description: "Type of AWS sidecar to deploy",
    example: "X-Ray for tracing, CloudWatch for metrics, App Mesh for service mesh",
    learnMore: "Each sidecar provides different observability or networking capabilities"
  },
  'aws.sidecar.xrayVersion': {
    description: "Version of AWS X-Ray daemon",
    example: "latest, 3.x, specific version tag",
    learnMore: "X-Ray daemon collects trace data and sends to X-Ray service"
  },
  'aws.sidecar.cloudwatchRegion': {
    description: "AWS region for CloudWatch",
    example: "us-east-1, eu-west-1, ap-southeast-1",
    learnMore: "Region where CloudWatch logs and metrics are sent"
  },
  'aws.sidecar.appMeshVirtualNode': {
    description: "App Mesh virtual node configuration",
    example: "mesh/my-mesh/virtualNode/my-service",
    learnMore: "Links pod to App Mesh virtual node for service mesh features"
  },
  'aws.sidecar.enableXrayTracing': {
    description: "Enable distributed tracing with X-Ray",
    learnMore: "Injects X-Ray trace ID into requests for end-to-end visibility"
  },

  // Azure Sidecar fields
  'azure.sidecar.sidecarType': {
    description: "Type of Azure sidecar to deploy",
    example: "Application Insights for APM, Dapr for microservices, OSM for service mesh",
    learnMore: "Azure provides multiple sidecar options for different scenarios"
  },
  'azure.sidecar.instrumentationKey': {
    description: "Application Insights instrumentation key",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    learnMore: "Required for sending telemetry to Application Insights"
  },
  'azure.sidecar.daprAppId': {
    description: "Unique identifier for Dapr application",
    example: "my-app, order-service, payment-api",
    validationRules: "Used for service discovery and invocation",
    learnMore: "Dapr uses app ID for service-to-service communication"
  },
  'azure.sidecar.daprPort': {
    description: "Port your application listens on for Dapr",
    example: "8080, 3000, 5000",
    learnMore: "Dapr sidecar forwards requests to this port"
  },
  'azure.sidecar.enableDapr': {
    description: "Enable Dapr sidecar injection",
    learnMore: "Automatically inject Dapr sidecar for microservices capabilities"
  },

  // GCP Sidecar fields
  'gcp.sidecar.sidecarType': {
    description: "Type of GCP sidecar to deploy",
    example: "Cloud Trace for tracing, Cloud SQL Proxy for database, Traffic Director for mesh",
    learnMore: "GCP sidecars integrate with Google Cloud services"
  },
  'gcp.sidecar.projectId': {
    description: "Google Cloud project ID",
    example: "my-project-123456, production-app-456789",
    learnMore: "Project where Cloud services (Trace, Logging) are configured"
  },
  'gcp.sidecar.cloudSqlInstance': {
    description: "Cloud SQL instance connection name",
    example: "my-project:us-central1:my-instance",
    validationRules: "Format: project:region:instance",
    learnMore: "Cloud SQL Proxy provides secure connection without managing IPs"
  },
  'gcp.sidecar.cloudSqlPort': {
    description: "Local port for Cloud SQL connection",
    example: "5432 (PostgreSQL), 3306 (MySQL), 1433 (SQL Server)",
    learnMore: "Application connects to localhost:port instead of Cloud SQL IP"
  },
  'gcp.sidecar.enableIstioProxy': {
    description: "Enable Istio sidecar injection",
    learnMore: "Istio provides service mesh features: mTLS, traffic management, observability"
  },
  'gcp.sidecar.traceSamplingRate': {
    description: "Percentage of requests to trace",
    example: "1 (1%), 10 (10%), 100 (all requests)",
    validationRules: "0-100 percentage",
    learnMore: "Lower sampling reduces overhead and costs for high-traffic apps"
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
