import { K8sNodeType } from '@/types/k8s';
import { Node, Edge } from 'reactflow';

/**
 * Kubernetes Connection Rules Matrix
 * Defines which K8s resources can connect to which resources based on real-world architecture
 */

export interface ConnectionRule {
  from: K8sNodeType;
  to: K8sNodeType;
  allowed: boolean;
  reason?: string;
}

/**
 * Connection rules based on Kubernetes architecture best practices:
 *
 * Valid connections:
 * - Ingress → Service (Ingress routes traffic to Services)
 * - Service → Deployment (Service selects Pods from Deployments)
 * - Service → Pod (Service can directly select standalone Pods)
 * - Deployment → ConfigMap (Deployment can mount ConfigMaps)
 * - Deployment → Secret (Deployment can mount Secrets)
 * - Deployment → PVC (Deployment can mount Persistent Volume Claims)
 * - Pod → ConfigMap (Pod can mount ConfigMaps)
 * - Pod → Secret (Pod can mount Secrets)
 * - Pod → PVC (Pod can mount Persistent Volume Claims)
 * - HPA → Deployment (HPA scales Deployments)
 * - CronJob → ConfigMap (CronJob can use ConfigMaps)
 * - CronJob → Secret (CronJob can use Secrets)
 *
 * Invalid connections:
 * - Ingress → Deployment (Ingress doesn't route directly to Deployments)
 * - Ingress → Pod (Ingress doesn't route directly to Pods)
 * - Service → ConfigMap/Secret/PVC (Services don't mount volumes)
 * - ConfigMap/Secret/PVC → anything (These are passive resources)
 * - HPA → Service/Ingress (HPA only scales Deployments/StatefulSets)
 */

const connectionRules: ConnectionRule[] = [
  // Ingress connections
  { from: 'ingress', to: 'service', allowed: true },
  { from: 'ingress', to: 'deployment', allowed: false, reason: 'Ingress must route to Services, not directly to Deployments' },
  { from: 'ingress', to: 'pod', allowed: false, reason: 'Ingress must route to Services, not directly to Pods' },
  { from: 'ingress', to: 'configmap', allowed: false, reason: 'Ingress cannot connect to ConfigMaps' },
  { from: 'ingress', to: 'secret', allowed: false, reason: 'Ingress cannot connect to Secrets (except via TLS config in properties)' },
  { from: 'ingress', to: 'pvc', allowed: false, reason: 'Ingress cannot connect to PVCs' },
  { from: 'ingress', to: 'cronjob', allowed: false, reason: 'Ingress cannot route to CronJobs' },
  { from: 'ingress', to: 'hpa', allowed: false, reason: 'Ingress cannot connect to HPAs' },
  { from: 'ingress', to: 'ingress', allowed: false, reason: 'Ingress cannot connect to another Ingress' },

  // Service connections
  { from: 'service', to: 'deployment', allowed: true },
  { from: 'service', to: 'pod', allowed: true },
  { from: 'service', to: 'ingress', allowed: false, reason: 'Services are selected by Ingress, not the reverse' },
  { from: 'service', to: 'service', allowed: false, reason: 'Services cannot connect to other Services directly' },
  { from: 'service', to: 'configmap', allowed: false, reason: 'Services cannot mount ConfigMaps' },
  { from: 'service', to: 'secret', allowed: false, reason: 'Services cannot mount Secrets' },
  { from: 'service', to: 'pvc', allowed: false, reason: 'Services cannot mount PVCs' },
  { from: 'service', to: 'cronjob', allowed: false, reason: 'Services cannot select CronJobs' },
  { from: 'service', to: 'hpa', allowed: false, reason: 'Services cannot connect to HPAs' },

  // Deployment connections
  { from: 'deployment', to: 'configmap', allowed: true },
  { from: 'deployment', to: 'secret', allowed: true },
  { from: 'deployment', to: 'pvc', allowed: true },
  { from: 'deployment', to: 'ingress', allowed: false, reason: 'Deployments are selected by Services, not Ingress' },
  { from: 'deployment', to: 'service', allowed: false, reason: 'Deployments are selected by Services, not the reverse' },
  { from: 'deployment', to: 'deployment', allowed: false, reason: 'Deployments cannot connect to other Deployments' },
  { from: 'deployment', to: 'pod', allowed: false, reason: 'Deployments manage their own Pods' },
  { from: 'deployment', to: 'cronjob', allowed: false, reason: 'Deployments cannot connect to CronJobs' },
  { from: 'deployment', to: 'hpa', allowed: false, reason: 'HPAs target Deployments, not the reverse' },

  // Pod connections (standalone pods)
  { from: 'pod', to: 'configmap', allowed: true },
  { from: 'pod', to: 'secret', allowed: true },
  { from: 'pod', to: 'pvc', allowed: true },
  { from: 'pod', to: 'ingress', allowed: false, reason: 'Pods are selected by Services, not Ingress' },
  { from: 'pod', to: 'service', allowed: false, reason: 'Pods are selected by Services, not the reverse' },
  { from: 'pod', to: 'deployment', allowed: false, reason: 'Standalone Pods cannot connect to Deployments' },
  { from: 'pod', to: 'pod', allowed: false, reason: 'Pods cannot connect to other Pods directly' },
  { from: 'pod', to: 'cronjob', allowed: false, reason: 'Pods cannot connect to CronJobs' },
  { from: 'pod', to: 'hpa', allowed: false, reason: 'Pods cannot connect to HPAs' },

  // ConfigMap connections (passive resource - cannot initiate connections)
  { from: 'configmap', to: 'ingress', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'service', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'deployment', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'pod', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'configmap', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'secret', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'pvc', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'cronjob', allowed: false, reason: 'ConfigMaps are passive resources' },
  { from: 'configmap', to: 'hpa', allowed: false, reason: 'ConfigMaps are passive resources' },

  // Secret connections (passive resource - cannot initiate connections)
  { from: 'secret', to: 'ingress', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'service', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'deployment', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'pod', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'configmap', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'secret', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'pvc', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'cronjob', allowed: false, reason: 'Secrets are passive resources' },
  { from: 'secret', to: 'hpa', allowed: false, reason: 'Secrets are passive resources' },

  // PVC connections (passive resource - cannot initiate connections)
  { from: 'pvc', to: 'ingress', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'service', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'deployment', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'pod', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'configmap', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'secret', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'pvc', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'cronjob', allowed: false, reason: 'PVCs are passive resources' },
  { from: 'pvc', to: 'hpa', allowed: false, reason: 'PVCs are passive resources' },

  // CronJob connections
  { from: 'cronjob', to: 'configmap', allowed: true },
  { from: 'cronjob', to: 'secret', allowed: true },
  { from: 'cronjob', to: 'pvc', allowed: true },
  { from: 'cronjob', to: 'ingress', allowed: false, reason: 'CronJobs run batch jobs, not web services' },
  { from: 'cronjob', to: 'service', allowed: false, reason: 'CronJobs run batch jobs, not exposed via Services' },
  { from: 'cronjob', to: 'deployment', allowed: false, reason: 'CronJobs cannot connect to Deployments' },
  { from: 'cronjob', to: 'pod', allowed: false, reason: 'CronJobs manage their own Pods' },
  { from: 'cronjob', to: 'cronjob', allowed: false, reason: 'CronJobs cannot connect to other CronJobs' },
  { from: 'cronjob', to: 'hpa', allowed: false, reason: 'CronJobs cannot be scaled by HPA' },

  // HPA connections
  { from: 'hpa', to: 'deployment', allowed: true },
  { from: 'hpa', to: 'ingress', allowed: false, reason: 'HPA scales workloads, not Ingress' },
  { from: 'hpa', to: 'service', allowed: false, reason: 'HPA scales workloads, not Services' },
  { from: 'hpa', to: 'pod', allowed: false, reason: 'HPA scales Deployments/StatefulSets, not standalone Pods' },
  { from: 'hpa', to: 'configmap', allowed: false, reason: 'HPA cannot scale ConfigMaps' },
  { from: 'hpa', to: 'secret', allowed: false, reason: 'HPA cannot scale Secrets' },
  { from: 'hpa', to: 'pvc', allowed: false, reason: 'HPA cannot scale PVCs' },
  { from: 'hpa', to: 'cronjob', allowed: false, reason: 'HPA cannot scale CronJobs' },
  { from: 'hpa', to: 'hpa', allowed: false, reason: 'HPA cannot connect to another HPA' },
];

/**
 * Validates if a connection between two node types is allowed
 */
export function isConnectionAllowed(sourceType: K8sNodeType, targetType: K8sNodeType): { allowed: boolean; reason?: string } {
  const rule = connectionRules.find(r => r.from === sourceType && r.to === targetType);

  if (!rule) {
    return { allowed: false, reason: 'Connection type not defined' };
  }

  return { allowed: rule.allowed, reason: rule.reason };
}

/**
 * Validates a connection attempt and returns whether it's valid
 */
export function validateConnection(
  sourceNode: Node | undefined,
  targetNode: Node | undefined
): { valid: boolean; message?: string } {
  if (!sourceNode || !targetNode) {
    return { valid: false, message: 'Invalid nodes' };
  }

  const sourceType = (sourceNode.data as any)?.type;
  const targetType = (targetNode.data as any)?.type;

  if (!sourceType || !targetType) {
    return { valid: false, message: 'Invalid node types' };
  }

  const validation = isConnectionAllowed(sourceType, targetType);

  return {
    valid: validation.allowed,
    message: validation.reason
  };
}

/**
 * Gets all valid target types for a given source type
 */
export function getValidTargets(sourceType: K8sNodeType): K8sNodeType[] {
  return connectionRules
    .filter(rule => rule.from === sourceType && rule.allowed)
    .map(rule => rule.to);
}

/**
 * Gets all valid source types for a given target type
 */
export function getValidSources(targetType: K8sNodeType): K8sNodeType[] {
  return connectionRules
    .filter(rule => rule.to === targetType && rule.allowed)
    .map(rule => rule.from);
}

/**
 * Checks if there's already a connection between two nodes
 */
export function hasExistingConnection(
  sourceId: string,
  targetId: string,
  edges: Edge[]
): boolean {
  return edges.some(
    edge => edge.source === sourceId && edge.target === targetId
  );
}
