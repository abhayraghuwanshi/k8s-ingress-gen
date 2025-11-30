export type CloudProvider = 'none' | 'aws' | 'azure' | 'gcp' | 'custom';

export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'keyvalue';

export interface CloudProviderField {
  key: string;
  label: string;
  type: FieldType;
  description: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  validationRules?: string;
  helpText?: string;
  generateAnnotation?: (value: any) => { key: string; value: string } | null;
  generateLabel?: (value: any) => { key: string; value: string } | null;
}

export interface CloudProviderTemplate {
  id: string;
  name: string;
  provider: CloudProvider;
  resourceType: 'deployment' | 'pvc' | 'secret' | 'sidecar';
  fields: CloudProviderField[];
  annotations?: { key: string; value: string }[];
  labels?: { key: string; value: string }[];
}

export interface CloudProviderFieldValues {
  [key: string]: any;
}

// Template registry
const cloudProviderTemplates: CloudProviderTemplate[] = [];

export function registerCloudProviderTemplate(template: CloudProviderTemplate) {
  const existingIndex = cloudProviderTemplates.findIndex(t => t.id === template.id);
  if (existingIndex >= 0) {
    cloudProviderTemplates[existingIndex] = template;
  } else {
    cloudProviderTemplates.push(template);
  }
}

export function getCloudProviderTemplates(resourceType?: 'deployment' | 'pvc'): CloudProviderTemplate[] {
  if (resourceType) {
    return cloudProviderTemplates.filter(t => t.resourceType === resourceType);
  }
  return cloudProviderTemplates;
}

export function getCloudProviderTemplate(id: string): CloudProviderTemplate | undefined {
  return cloudProviderTemplates.find(t => t.id === id);
}

export function getTemplatesByProvider(provider: CloudProvider, resourceType?: 'deployment' | 'pvc'): CloudProviderTemplate[] {
  return cloudProviderTemplates.filter(t =>
    t.provider === provider && (!resourceType || t.resourceType === resourceType)
  );
}

// Helper function to generate annotations from template field values
export function generateAnnotationsFromTemplate(
  template: CloudProviderTemplate,
  fieldValues: CloudProviderFieldValues
): { key: string; value: string }[] {
  const annotations: { key: string; value: string }[] = [];

  // Add static annotations from template
  if (template.annotations) {
    annotations.push(...template.annotations);
  }

  // Add dynamic annotations from field generators
  template.fields.forEach(field => {
    if (field.generateAnnotation && fieldValues[field.key]) {
      const annotation = field.generateAnnotation(fieldValues[field.key]);
      if (annotation) {
        annotations.push(annotation);
      }
    }
  });

  return annotations;
}

// Helper function to generate labels from template field values
export function generateLabelsFromTemplate(
  template: CloudProviderTemplate,
  fieldValues: CloudProviderFieldValues
): { key: string; value: string }[] {
  const labels: { key: string; value: string }[] = [];

  // Add static labels from template
  if (template.labels) {
    labels.push(...labels);
  }

  // Add dynamic labels from field generators
  template.fields.forEach(field => {
    if (field.generateLabel && fieldValues[field.key]) {
      const label = field.generateLabel(fieldValues[field.key]);
      if (label) {
        labels.push(label);
      }
    }
  });

  return labels;
}

// ============================================================================
// DEFAULT CLOUD PROVIDER TEMPLATES
// ============================================================================

// AWS - Deployment Template
const awsDeploymentTemplate: CloudProviderTemplate = {
  id: 'aws-deployment',
  name: 'AWS EKS Deployment',
  provider: 'aws',
  resourceType: 'deployment',
  fields: [
    {
      key: 'containerRegistry',
      label: 'Container Registry',
      type: 'select',
      description: 'AWS container registry type',
      options: [
        { label: 'Amazon ECR Public', value: 'public.ecr.aws' },
        { label: 'Amazon ECR Private', value: 'ecr' },
        { label: 'Docker Hub', value: 'dockerhub' },
      ],
      defaultValue: 'ecr',
      helpText: 'Select the container registry for your images',
    },
    {
      key: 'ecrRepository',
      label: 'ECR Repository URI',
      type: 'text',
      description: 'Full ECR repository URI',
      placeholder: '123456789.dkr.ecr.us-east-1.amazonaws.com/my-app',
      helpText: 'Format: {account-id}.dkr.ecr.{region}.amazonaws.com/{repo-name}',
    },
    {
      key: 'iamRole',
      label: 'IAM Role ARN',
      type: 'text',
      description: 'IAM role for service account (IRSA)',
      placeholder: 'arn:aws:iam::123456789:role/my-app-role',
      helpText: 'IAM role ARN for pod service account authentication',
      generateAnnotation: (value: string) =>
        value ? { key: 'eks.amazonaws.com/role-arn', value } : null,
    },
    {
      key: 'cpuRequest',
      label: 'CPU Request',
      type: 'text',
      description: 'CPU resource request',
      placeholder: '100m',
      defaultValue: '100m',
      helpText: 'CPU units (e.g., 100m = 0.1 CPU)',
    },
    {
      key: 'memoryRequest',
      label: 'Memory Request',
      type: 'text',
      description: 'Memory resource request',
      placeholder: '128Mi',
      defaultValue: '128Mi',
      helpText: 'Memory in Mi or Gi (e.g., 128Mi, 1Gi)',
    },
    {
      key: 'cpuLimit',
      label: 'CPU Limit',
      type: 'text',
      description: 'CPU resource limit',
      placeholder: '500m',
      helpText: 'Maximum CPU allocation',
    },
    {
      key: 'memoryLimit',
      label: 'Memory Limit',
      type: 'text',
      description: 'Memory resource limit',
      placeholder: '512Mi',
      helpText: 'Maximum memory allocation',
    },
    {
      key: 'nodeSelector',
      label: 'Node Selector',
      type: 'text',
      description: 'AWS node instance type selector',
      placeholder: 'node.kubernetes.io/instance-type=t3.medium',
      helpText: 'Kubernetes node selector for EC2 instance types',
    },
  ],
};

// AWS - PVC Template
const awsPVCTemplate: CloudProviderTemplate = {
  id: 'aws-pvc',
  name: 'AWS EBS Volume',
  provider: 'aws',
  resourceType: 'pvc',
  fields: [
    {
      key: 'storageClass',
      label: 'Storage Class',
      type: 'select',
      description: 'AWS EBS storage class',
      options: [
        { label: 'gp3 - General Purpose SSD (default)', value: 'gp3' },
        { label: 'gp2 - General Purpose SSD (previous gen)', value: 'gp2' },
        { label: 'io1 - Provisioned IOPS SSD', value: 'io1' },
        { label: 'io2 - Provisioned IOPS SSD (v2)', value: 'io2' },
        { label: 'st1 - Throughput Optimized HDD', value: 'st1' },
        { label: 'sc1 - Cold HDD', value: 'sc1' },
      ],
      defaultValue: 'gp3',
      helpText: 'EBS volume type - gp3 recommended for most workloads',
    },
    {
      key: 'iops',
      label: 'IOPS',
      type: 'number',
      description: 'Provisioned IOPS (for io1/io2/gp3)',
      placeholder: '3000',
      helpText: 'IOPS for io1/io2 volumes or gp3 (3000-16000)',
      generateAnnotation: (value: number) =>
        value ? { key: 'ebs.csi.aws.com/iops', value: value.toString() } : null,
    },
    {
      key: 'throughput',
      label: 'Throughput (MB/s)',
      type: 'number',
      description: 'Throughput for gp3 volumes',
      placeholder: '125',
      helpText: 'Throughput in MB/s for gp3 volumes (125-1000)',
      generateAnnotation: (value: number) =>
        value ? { key: 'ebs.csi.aws.com/throughput', value: value.toString() } : null,
    },
    {
      key: 'volumeType',
      label: 'Volume Type',
      type: 'select',
      description: 'EBS volume type',
      options: [
        { label: 'gp3', value: 'gp3' },
        { label: 'gp2', value: 'gp2' },
        { label: 'io1', value: 'io1' },
        { label: 'io2', value: 'io2' },
        { label: 'st1', value: 'st1' },
        { label: 'sc1', value: 'sc1' },
      ],
      defaultValue: 'gp3',
      generateAnnotation: (value: string) =>
        value ? { key: 'ebs.csi.aws.com/volumeType', value } : null,
    },
    {
      key: 'encrypted',
      label: 'Encrypted',
      type: 'checkbox',
      description: 'Enable EBS encryption',
      defaultValue: true,
      helpText: 'Encrypt EBS volume at rest',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'ebs.csi.aws.com/encrypted', value: 'true' } : null,
    },
    {
      key: 'kmsKeyId',
      label: 'KMS Key ID',
      type: 'text',
      description: 'AWS KMS key ID for encryption',
      placeholder: 'arn:aws:kms:us-east-1:123456789:key/abcd-1234',
      helpText: 'KMS key ARN for EBS encryption',
      generateAnnotation: (value: string) =>
        value ? { key: 'ebs.csi.aws.com/kmsKeyId', value } : null,
    },
  ],
  annotations: [
    { key: 'volume.beta.kubernetes.io/storage-provisioner', value: 'ebs.csi.aws.com' },
  ],
};

// Azure - Deployment Template
const azureDeploymentTemplate: CloudProviderTemplate = {
  id: 'azure-deployment',
  name: 'Azure AKS Deployment',
  provider: 'azure',
  resourceType: 'deployment',
  fields: [
    {
      key: 'containerRegistry',
      label: 'Container Registry',
      type: 'select',
      description: 'Azure container registry type',
      options: [
        { label: 'Azure Container Registry (ACR)', value: 'acr' },
        { label: 'Docker Hub', value: 'dockerhub' },
      ],
      defaultValue: 'acr',
      helpText: 'Select the container registry for your images',
    },
    {
      key: 'acrName',
      label: 'ACR Name',
      type: 'text',
      description: 'Azure Container Registry name',
      placeholder: 'myregistry.azurecr.io',
      helpText: 'Format: {registry-name}.azurecr.io',
    },
    {
      key: 'managedIdentity',
      label: 'Managed Identity Client ID',
      type: 'text',
      description: 'Azure managed identity for pod',
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      helpText: 'Azure AD managed identity client ID for workload identity',
      generateAnnotation: (value: string) =>
        value ? { key: 'azure.workload.identity/client-id', value } : null,
    },
    {
      key: 'useWorkloadIdentity',
      label: 'Use Workload Identity',
      type: 'checkbox',
      description: 'Enable Azure Workload Identity',
      defaultValue: false,
      helpText: 'Use Azure AD workload identity for authentication',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'azure.workload.identity/use', value: 'true' } : null,
    },
    {
      key: 'cpuRequest',
      label: 'CPU Request',
      type: 'text',
      description: 'CPU resource request',
      placeholder: '100m',
      defaultValue: '100m',
      helpText: 'CPU units (e.g., 100m = 0.1 CPU)',
    },
    {
      key: 'memoryRequest',
      label: 'Memory Request',
      type: 'text',
      description: 'Memory resource request',
      placeholder: '128Mi',
      defaultValue: '128Mi',
      helpText: 'Memory in Mi or Gi',
    },
    {
      key: 'cpuLimit',
      label: 'CPU Limit',
      type: 'text',
      description: 'CPU resource limit',
      placeholder: '500m',
      helpText: 'Maximum CPU allocation',
    },
    {
      key: 'memoryLimit',
      label: 'Memory Limit',
      type: 'text',
      description: 'Memory resource limit',
      placeholder: '512Mi',
      helpText: 'Maximum memory allocation',
    },
  ],
};

// Azure - PVC Template
const azurePVCTemplate: CloudProviderTemplate = {
  id: 'azure-pvc',
  name: 'Azure Disk',
  provider: 'azure',
  resourceType: 'pvc',
  fields: [
    {
      key: 'storageClass',
      label: 'Storage Class',
      type: 'select',
      description: 'Azure Disk storage class',
      options: [
        { label: 'managed-csi - Default managed disk', value: 'managed-csi' },
        { label: 'managed-csi-premium - Premium SSD', value: 'managed-csi-premium' },
        { label: 'azurefile - Azure Files (ReadWriteMany)', value: 'azurefile' },
        { label: 'azurefile-csi - Azure Files CSI', value: 'azurefile-csi' },
      ],
      defaultValue: 'managed-csi',
      helpText: 'Azure disk type - Premium SSD for production workloads',
    },
    {
      key: 'skuName',
      label: 'SKU Name',
      type: 'select',
      description: 'Azure Disk SKU',
      options: [
        { label: 'Standard_LRS - Standard HDD', value: 'Standard_LRS' },
        { label: 'StandardSSD_LRS - Standard SSD', value: 'StandardSSD_LRS' },
        { label: 'Premium_LRS - Premium SSD', value: 'Premium_LRS' },
        { label: 'UltraSSD_LRS - Ultra SSD', value: 'UltraSSD_LRS' },
        { label: 'Premium_ZRS - Premium ZRS', value: 'Premium_ZRS' },
      ],
      defaultValue: 'StandardSSD_LRS',
      helpText: 'Disk performance tier',
      generateAnnotation: (value: string) =>
        value ? { key: 'disk.csi.azure.com/skuName', value } : null,
    },
    {
      key: 'cachingMode',
      label: 'Caching Mode',
      type: 'select',
      description: 'Disk caching mode',
      options: [
        { label: 'None', value: 'None' },
        { label: 'ReadOnly', value: 'ReadOnly' },
        { label: 'ReadWrite', value: 'ReadWrite' },
      ],
      defaultValue: 'ReadOnly',
      helpText: 'Host caching mode for the disk',
      generateAnnotation: (value: string) =>
        value ? { key: 'disk.csi.azure.com/cachingMode', value } : null,
    },
    {
      key: 'resourceGroup',
      label: 'Resource Group',
      type: 'text',
      description: 'Azure resource group for disk',
      placeholder: 'my-resource-group',
      helpText: 'Azure resource group where disk will be created',
      generateAnnotation: (value: string) =>
        value ? { key: 'disk.csi.azure.com/resourceGroup', value } : null,
    },
  ],
  annotations: [
    { key: 'volume.beta.kubernetes.io/storage-provisioner', value: 'disk.csi.azure.com' },
  ],
};

// GCP - Deployment Template
const gcpDeploymentTemplate: CloudProviderTemplate = {
  id: 'gcp-deployment',
  name: 'GCP GKE Deployment',
  provider: 'gcp',
  resourceType: 'deployment',
  fields: [
    {
      key: 'containerRegistry',
      label: 'Container Registry',
      type: 'select',
      description: 'GCP container registry type',
      options: [
        { label: 'Artifact Registry', value: 'artifact-registry' },
        { label: 'Container Registry (gcr.io)', value: 'gcr' },
        { label: 'Docker Hub', value: 'dockerhub' },
      ],
      defaultValue: 'artifact-registry',
      helpText: 'Artifact Registry is the recommended registry for GCP',
    },
    {
      key: 'artifactRegistryPath',
      label: 'Artifact Registry Path',
      type: 'text',
      description: 'Full Artifact Registry path',
      placeholder: 'us-docker.pkg.dev/my-project/my-repo/my-app',
      helpText: 'Format: {region}-docker.pkg.dev/{project-id}/{repo}/{image}',
    },
    {
      key: 'workloadIdentity',
      label: 'Workload Identity',
      type: 'text',
      description: 'GCP service account for workload identity',
      placeholder: 'my-app@my-project.iam.gserviceaccount.com',
      helpText: 'GCP service account email for workload identity binding',
      generateAnnotation: (value: string) =>
        value ? { key: 'iam.gke.io/gcp-service-account', value } : null,
    },
    {
      key: 'cpuRequest',
      label: 'CPU Request',
      type: 'text',
      description: 'CPU resource request',
      placeholder: '100m',
      defaultValue: '100m',
      helpText: 'CPU units (e.g., 100m = 0.1 CPU)',
    },
    {
      key: 'memoryRequest',
      label: 'Memory Request',
      type: 'text',
      description: 'Memory resource request',
      placeholder: '128Mi',
      defaultValue: '128Mi',
      helpText: 'Memory in Mi or Gi',
    },
    {
      key: 'cpuLimit',
      label: 'CPU Limit',
      type: 'text',
      description: 'CPU resource limit',
      placeholder: '500m',
      helpText: 'Maximum CPU allocation',
    },
    {
      key: 'memoryLimit',
      label: 'Memory Limit',
      type: 'text',
      description: 'Memory resource limit',
      placeholder: '512Mi',
      helpText: 'Maximum memory allocation',
    },
    {
      key: 'nodeSelector',
      label: 'Node Pool Selector',
      type: 'text',
      description: 'GKE node pool selector',
      placeholder: 'cloud.google.com/gke-nodepool=default-pool',
      helpText: 'Selector for specific GKE node pool',
    },
  ],
};

// GCP - PVC Template
const gcpPVCTemplate: CloudProviderTemplate = {
  id: 'gcp-pvc',
  name: 'GCP Persistent Disk',
  provider: 'gcp',
  resourceType: 'pvc',
  fields: [
    {
      key: 'storageClass',
      label: 'Storage Class',
      type: 'select',
      description: 'GCP persistent disk storage class',
      options: [
        { label: 'standard-rwo - Standard PD (balanced)', value: 'standard-rwo' },
        { label: 'premium-rwo - SSD PD', value: 'premium-rwo' },
        { label: 'standard - Standard PD (legacy)', value: 'standard' },
      ],
      defaultValue: 'standard-rwo',
      helpText: 'Disk type - use premium-rwo for high-performance workloads',
    },
    {
      key: 'diskType',
      label: 'Disk Type',
      type: 'select',
      description: 'GCE persistent disk type',
      options: [
        { label: 'pd-standard - Standard persistent disk', value: 'pd-standard' },
        { label: 'pd-balanced - Balanced persistent disk', value: 'pd-balanced' },
        { label: 'pd-ssd - SSD persistent disk', value: 'pd-ssd' },
        { label: 'pd-extreme - Extreme persistent disk', value: 'pd-extreme' },
      ],
      defaultValue: 'pd-balanced',
      helpText: 'Performance tier for the persistent disk',
      generateAnnotation: (value: string) =>
        value ? { key: 'disk.csi.gke.io/type', value } : null,
    },
    {
      key: 'replicationType',
      label: 'Replication Type',
      type: 'select',
      description: 'Disk replication type',
      options: [
        { label: 'none - Single zone', value: 'none' },
        { label: 'regional-pd - Regional replication', value: 'regional-pd' },
      ],
      defaultValue: 'none',
      helpText: 'Regional PD provides higher availability',
      generateAnnotation: (value: string) =>
        value && value !== 'none' ? { key: 'disk.csi.gke.io/replication-type', value } : null,
    },
    {
      key: 'provisionedIops',
      label: 'Provisioned IOPS',
      type: 'number',
      description: 'Provisioned IOPS (pd-extreme only)',
      placeholder: '10000',
      helpText: 'IOPS for pd-extreme disks',
      generateAnnotation: (value: number) =>
        value ? { key: 'disk.csi.gke.io/provisioned-iops-on-create', value: value.toString() } : null,
    },
  ],
  annotations: [
    { key: 'volume.beta.kubernetes.io/storage-provisioner', value: 'pd.csi.storage.gke.io' },
  ],
};

// AWS - Secret Template
const awsSecretTemplate: CloudProviderTemplate = {
  id: 'aws-secret',
  name: 'AWS Secrets Manager',
  provider: 'aws',
  resourceType: 'secret',
  fields: [
    {
      key: 'secretProvider',
      label: 'Secret Provider',
      type: 'select',
      description: 'AWS secret provider type',
      options: [
        { label: 'Secrets Manager', value: 'secrets-manager' },
        { label: 'Parameter Store', value: 'parameter-store' },
        { label: 'External Secrets Operator', value: 'external-secrets' },
      ],
      defaultValue: 'secrets-manager',
      helpText: 'Choose how secrets are managed in AWS',
    },
    {
      key: 'secretsManagerArn',
      label: 'Secrets Manager ARN',
      type: 'text',
      description: 'AWS Secrets Manager secret ARN',
      placeholder: 'arn:aws:secretsmanager:us-east-1:123456789:secret:my-secret-abc123',
      helpText: 'ARN of the secret in AWS Secrets Manager',
      generateAnnotation: (value: string) =>
        value ? { key: 'secrets-manager.io/secret-arn', value } : null,
    },
    {
      key: 'parameterStorePrefix',
      label: 'Parameter Store Prefix',
      type: 'text',
      description: 'SSM Parameter Store path prefix',
      placeholder: '/myapp/prod/',
      helpText: 'Path prefix for parameters in SSM Parameter Store',
      generateAnnotation: (value: string) =>
        value ? { key: 'parameter-store.io/path-prefix', value } : null,
    },
    {
      key: 'rotationEnabled',
      label: 'Enable Automatic Rotation',
      type: 'checkbox',
      description: 'Enable AWS Secrets Manager rotation',
      defaultValue: false,
      helpText: 'Automatically rotate secrets using Lambda',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'secrets-manager.io/rotation-enabled', value: 'true' } : null,
    },
    {
      key: 'region',
      label: 'AWS Region',
      type: 'text',
      description: 'AWS region for secrets',
      placeholder: 'us-east-1',
      defaultValue: 'us-east-1',
      helpText: 'AWS region where secrets are stored',
      generateAnnotation: (value: string) =>
        value ? { key: 'secrets-manager.io/region', value } : null,
    },
  ],
};

// Azure - Secret Template
const azureSecretTemplate: CloudProviderTemplate = {
  id: 'azure-secret',
  name: 'Azure Key Vault',
  provider: 'azure',
  resourceType: 'secret',
  fields: [
    {
      key: 'keyVaultName',
      label: 'Key Vault Name',
      type: 'text',
      description: 'Azure Key Vault name',
      placeholder: 'my-keyvault',
      helpText: 'Name of the Azure Key Vault containing secrets',
      generateAnnotation: (value: string) =>
        value ? { key: 'azure-key-vault.io/vault-name', value } : null,
    },
    {
      key: 'keyVaultUri',
      label: 'Key Vault URI',
      type: 'text',
      description: 'Full Key Vault URI',
      placeholder: 'https://my-keyvault.vault.azure.net/',
      helpText: 'Full URI of the Azure Key Vault',
      generateAnnotation: (value: string) =>
        value ? { key: 'azure-key-vault.io/vault-uri', value } : null,
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      description: 'Azure AD tenant ID',
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      helpText: 'Azure Active Directory tenant ID',
      generateAnnotation: (value: string) =>
        value ? { key: 'azure-key-vault.io/tenant-id', value } : null,
    },
    {
      key: 'usePodIdentity',
      label: 'Use Pod Identity',
      type: 'checkbox',
      description: 'Enable Azure Pod Identity',
      defaultValue: false,
      helpText: 'Use Azure AD Pod Identity for authentication',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'aadpodidbinding', value: 'azure-pod-identity' } : null,
    },
    {
      key: 'useWorkloadIdentity',
      label: 'Use Workload Identity',
      type: 'checkbox',
      description: 'Enable Azure Workload Identity',
      defaultValue: true,
      helpText: 'Recommended: Use workload identity instead of pod identity',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'azure.workload.identity/use', value: 'true' } : null,
    },
    {
      key: 'cloudProviderClass',
      label: 'CSI Provider Class',
      type: 'select',
      description: 'Secret provider class for CSI driver',
      options: [
        { label: 'Azure Key Vault CSI', value: 'azure-keyvault' },
        { label: 'External Secrets Operator', value: 'external-secrets' },
      ],
      defaultValue: 'azure-keyvault',
      helpText: 'Method to sync secrets from Key Vault',
    },
  ],
};

// GCP - Secret Template
const gcpSecretTemplate: CloudProviderTemplate = {
  id: 'gcp-secret',
  name: 'GCP Secret Manager',
  provider: 'gcp',
  resourceType: 'secret',
  fields: [
    {
      key: 'projectId',
      label: 'GCP Project ID',
      type: 'text',
      description: 'Google Cloud project ID',
      placeholder: 'my-project-123456',
      helpText: 'GCP project containing the secrets',
      generateAnnotation: (value: string) =>
        value ? { key: 'secret-manager.io/project-id', value } : null,
    },
    {
      key: 'secretName',
      label: 'Secret Manager Secret Name',
      type: 'text',
      description: 'Name of secret in Secret Manager',
      placeholder: 'my-application-secret',
      helpText: 'Secret name in GCP Secret Manager',
      generateAnnotation: (value: string) =>
        value ? { key: 'secret-manager.io/secret-name', value } : null,
    },
    {
      key: 'secretVersion',
      label: 'Secret Version',
      type: 'text',
      description: 'Version of the secret',
      placeholder: 'latest',
      defaultValue: 'latest',
      helpText: 'Secret version to use (latest, or specific version number)',
      generateAnnotation: (value: string) =>
        value ? { key: 'secret-manager.io/version', value } : null,
    },
    {
      key: 'workloadIdentity',
      label: 'Workload Identity Service Account',
      type: 'text',
      description: 'GCP service account email',
      placeholder: 'my-app@my-project.iam.gserviceaccount.com',
      helpText: 'Service account with Secret Manager access',
      generateAnnotation: (value: string) =>
        value ? { key: 'iam.gke.io/gcp-service-account', value } : null,
    },
    {
      key: 'useExternalSecrets',
      label: 'Use External Secrets Operator',
      type: 'checkbox',
      description: 'Enable External Secrets Operator',
      defaultValue: true,
      helpText: 'Sync secrets from Secret Manager using ESO',
    },
    {
      key: 'autoRotate',
      label: 'Auto-Rotate Secrets',
      type: 'checkbox',
      description: 'Enable automatic secret rotation',
      defaultValue: false,
      helpText: 'Automatically sync secret updates from Secret Manager',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'secret-manager.io/auto-rotate', value: 'true' } : null,
    },
  ],
};

// AWS - Sidecar Template
const awsSidecarTemplate: CloudProviderTemplate = {
  id: 'aws-sidecar',
  name: 'AWS Observability & Service Mesh',
  provider: 'aws',
  resourceType: 'sidecar',
  fields: [
    {
      key: 'sidecarType',
      label: 'Sidecar Type',
      type: 'select',
      description: 'Type of AWS sidecar container',
      options: [
        { label: 'AWS X-Ray Daemon (tracing)', value: 'xray' },
        { label: 'CloudWatch Agent (metrics/logs)', value: 'cloudwatch' },
        { label: 'AWS App Mesh Envoy Proxy', value: 'appmesh' },
        { label: 'Fluent Bit (log forwarding)', value: 'fluentbit' },
      ],
      defaultValue: 'xray',
      helpText: 'Select the AWS sidecar service',
    },
    {
      key: 'xrayVersion',
      label: 'X-Ray Daemon Version',
      type: 'text',
      description: 'AWS X-Ray daemon image version',
      placeholder: 'latest',
      defaultValue: 'latest',
      helpText: 'Image tag for amazon/aws-xray-daemon',
    },
    {
      key: 'cloudwatchRegion',
      label: 'CloudWatch Region',
      type: 'text',
      description: 'AWS region for CloudWatch',
      placeholder: 'us-east-1',
      defaultValue: 'us-east-1',
      helpText: 'CloudWatch logs and metrics region',
    },
    {
      key: 'appMeshVirtualNode',
      label: 'App Mesh Virtual Node',
      type: 'text',
      description: 'App Mesh virtual node name',
      placeholder: 'mesh/my-mesh/virtualNode/my-node',
      helpText: 'ARN or name of the App Mesh virtual node',
      generateAnnotation: (value: string) =>
        value ? { key: 'appmesh.k8s.aws/virtualNode', value } : null,
    },
    {
      key: 'enableXrayTracing',
      label: 'Enable X-Ray Tracing',
      type: 'checkbox',
      description: 'Enable AWS X-Ray distributed tracing',
      defaultValue: true,
      helpText: 'Inject X-Ray tracing headers',
    },
  ],
};

// Azure - Sidecar Template
const azureSidecarTemplate: CloudProviderTemplate = {
  id: 'azure-sidecar',
  name: 'Azure Observability & Service Mesh',
  provider: 'azure',
  resourceType: 'sidecar',
  fields: [
    {
      key: 'sidecarType',
      label: 'Sidecar Type',
      type: 'select',
      description: 'Type of Azure sidecar container',
      options: [
        { label: 'Application Insights Agent', value: 'appinsights' },
        { label: 'Azure Monitor Agent', value: 'azuremonitor' },
        { label: 'Open Service Mesh Envoy', value: 'osm' },
        { label: 'Dapr Sidecar', value: 'dapr' },
      ],
      defaultValue: 'appinsights',
      helpText: 'Select the Azure sidecar service',
    },
    {
      key: 'instrumentationKey',
      label: 'Application Insights Key',
      type: 'text',
      description: 'Application Insights instrumentation key',
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      helpText: 'Instrumentation key for Application Insights',
    },
    {
      key: 'daprAppId',
      label: 'Dapr App ID',
      type: 'text',
      description: 'Dapr application identifier',
      placeholder: 'my-app',
      helpText: 'Unique identifier for Dapr sidecar',
      generateAnnotation: (value: string) =>
        value ? { key: 'dapr.io/app-id', value } : null,
    },
    {
      key: 'daprPort',
      label: 'Dapr App Port',
      type: 'number',
      description: 'Port that your app listens on',
      placeholder: '8080',
      helpText: 'Port for Dapr to communicate with your app',
      generateAnnotation: (value: number) =>
        value ? { key: 'dapr.io/app-port', value: value.toString() } : null,
    },
    {
      key: 'enableDapr',
      label: 'Enable Dapr',
      type: 'checkbox',
      description: 'Enable Dapr sidecar injection',
      defaultValue: false,
      helpText: 'Automatically inject Dapr sidecar',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'dapr.io/enabled', value: 'true' } : null,
    },
  ],
};

// GCP - Sidecar Template
const gcpSidecarTemplate: CloudProviderTemplate = {
  id: 'gcp-sidecar',
  name: 'GCP Observability & Service Mesh',
  provider: 'gcp',
  resourceType: 'sidecar',
  fields: [
    {
      key: 'sidecarType',
      label: 'Sidecar Type',
      type: 'select',
      description: 'Type of GCP sidecar container',
      options: [
        { label: 'Cloud Trace Agent', value: 'cloudtrace' },
        { label: 'Cloud Logging Agent', value: 'cloudlogging' },
        { label: 'Traffic Director Envoy Proxy', value: 'trafficdirector' },
        { label: 'Cloud SQL Proxy', value: 'cloudsql' },
      ],
      defaultValue: 'cloudtrace',
      helpText: 'Select the GCP sidecar service',
    },
    {
      key: 'projectId',
      label: 'GCP Project ID',
      type: 'text',
      description: 'Google Cloud project ID',
      placeholder: 'my-project-123456',
      helpText: 'Project for Cloud Trace/Logging',
    },
    {
      key: 'cloudSqlInstance',
      label: 'Cloud SQL Instance',
      type: 'text',
      description: 'Cloud SQL instance connection name',
      placeholder: 'project:region:instance',
      helpText: 'Format: project:region:instance for Cloud SQL Proxy',
    },
    {
      key: 'cloudSqlPort',
      label: 'Cloud SQL Port',
      type: 'number',
      description: 'Local port for Cloud SQL connection',
      placeholder: '5432',
      defaultValue: 5432,
      helpText: 'Local port to expose Cloud SQL (3306 for MySQL, 5432 for PostgreSQL)',
    },
    {
      key: 'enableIstioProxy',
      label: 'Enable Istio Proxy',
      type: 'checkbox',
      description: 'Enable Istio sidecar injection',
      defaultValue: false,
      helpText: 'Automatically inject Istio Envoy proxy',
      generateAnnotation: (value: boolean) =>
        value ? { key: 'sidecar.istio.io/inject', value: 'true' } : null,
    },
    {
      key: 'traceSamplingRate',
      label: 'Trace Sampling Rate',
      type: 'number',
      description: 'Percentage of traces to sample (0-100)',
      placeholder: '10',
      defaultValue: 10,
      helpText: 'Cloud Trace sampling rate (10% recommended)',
    },
  ],
};

// Register all default templates
registerCloudProviderTemplate(awsDeploymentTemplate);
registerCloudProviderTemplate(awsPVCTemplate);
registerCloudProviderTemplate(awsSecretTemplate);
registerCloudProviderTemplate(awsSidecarTemplate);
registerCloudProviderTemplate(azureDeploymentTemplate);
registerCloudProviderTemplate(azurePVCTemplate);
registerCloudProviderTemplate(azureSecretTemplate);
registerCloudProviderTemplate(azureSidecarTemplate);
registerCloudProviderTemplate(gcpDeploymentTemplate);
registerCloudProviderTemplate(gcpPVCTemplate);
registerCloudProviderTemplate(gcpSecretTemplate);
registerCloudProviderTemplate(gcpSidecarTemplate);
