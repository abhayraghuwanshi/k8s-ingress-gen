# Kubernetes Connection Rules

This document explains the connection validation rules implemented in the K8s Diagram Builder based on real-world Kubernetes architecture best practices.

## Overview

The diagram builder enforces proper Kubernetes resource relationships to ensure generated YAML configurations are valid and follow industry standards.

## Valid Connections

### Ingress Connections
- **Ingress → Service** ✅
  - Ingress resources route external HTTP/HTTPS traffic to Services
  - This is the standard way to expose applications to the internet

### Service Connections
- **Service → Deployment** ✅
  - Services select Pods managed by Deployments using label selectors
  - Most common pattern for exposing applications

- **Service → Pod** ✅
  - Services can directly select standalone Pods
  - Useful for debugging or special cases

### Deployment Connections
- **Deployment → ConfigMap** ✅
  - Deployments can mount ConfigMaps as volumes or environment variables
  - Used for application configuration

- **Deployment → Secret** ✅
  - Deployments can mount Secrets as volumes or environment variables
  - Used for sensitive data (passwords, API keys, certificates)

- **Deployment → PVC** ✅
  - Deployments can mount Persistent Volume Claims for persistent storage
  - Used for databases, file storage, etc.

### Pod Connections (Standalone)
- **Pod → ConfigMap** ✅
  - Standalone Pods can mount ConfigMaps

- **Pod → Secret** ✅
  - Standalone Pods can mount Secrets

- **Pod → PVC** ✅
  - Standalone Pods can mount PVCs

### HPA Connections
- **HPA → Deployment** ✅
  - Horizontal Pod Autoscaler scales Deployments based on metrics
  - Automatically adjusts replica count

### CronJob Connections
- **CronJob → ConfigMap** ✅
  - CronJobs can use ConfigMaps for configuration

- **CronJob → Secret** ✅
  - CronJobs can use Secrets for credentials

- **CronJob → PVC** ✅
  - CronJobs can mount persistent storage

## Invalid Connections & Reasons

### Ingress Rules
❌ **Ingress → Deployment**
- **Reason**: Ingress must route to Services, not directly to Deployments
- **Fix**: Create Service → Deployment, then Ingress → Service

❌ **Ingress → Pod**
- **Reason**: Ingress must route to Services, not directly to Pods
- **Fix**: Create Service → Pod, then Ingress → Service

❌ **Ingress → ConfigMap/Secret/PVC**
- **Reason**: Ingress is for routing, not for mounting resources
- **Note**: TLS secrets are configured via Ingress properties, not connections

### Service Rules
❌ **Service → ConfigMap/Secret/PVC**
- **Reason**: Services are for networking, they don't mount volumes
- **Fix**: Connect ConfigMaps/Secrets/PVCs to Deployments or Pods

❌ **Service → Ingress**
- **Reason**: Services are selected by Ingress, not the reverse

❌ **Service → CronJob**
- **Reason**: CronJobs run batch jobs, not long-running services

### Deployment Rules
❌ **Deployment → Service**
- **Reason**: Services select Deployments, not the reverse
- **Fix**: Connect Service → Deployment

❌ **Deployment → Ingress**
- **Reason**: Ingress routes to Services, which then select Deployments
- **Fix**: Create Ingress → Service → Deployment

### Passive Resources (ConfigMap, Secret, PVC)
❌ **ConfigMap/Secret/PVC → Anything**
- **Reason**: These are passive resources that are consumed by workloads
- **Fix**: Connect Deployments/Pods/CronJobs to these resources instead

### HPA Rules
❌ **HPA → Service/Ingress/Pod**
- **Reason**: HPA only scales Deployments and StatefulSets
- **Fix**: Connect HPA → Deployment

### CronJob Rules
❌ **CronJob → Service/Ingress**
- **Reason**: CronJobs run scheduled batch jobs, not web services
- **Note**: CronJobs create Pods on schedule, they're not continuously running

## Common Architecture Patterns

### Basic Web Application
```
Ingress → Service → Deployment → ConfigMap
                              → Secret
```

### Application with Database
```
Ingress → Service → Deployment → Secret (DB credentials)
                              → PVC (persistent data)
```

### Auto-Scaling Application
```
Ingress → Service → Deployment ← HPA
                              → ConfigMap
```

### Scheduled Batch Job
```
CronJob → ConfigMap
        → Secret
        → PVC
```

## Implementation Details

### How It Works
1. When you try to connect two nodes, the system checks the source and target types
2. It looks up the connection rule in the validation matrix
3. If invalid, it shows a toast notification with the specific reason
4. If valid, the connection is created with visual feedback

### User Experience
- **Invalid Connection**: Red toast notification with clear explanation
- **Valid Connection**: Green toast notification confirming the connection
- **Duplicate Connection**: Yellow toast notification preventing duplicates

### Code Location
- **Rules Definition**: `src/utils/connectionRules.ts`
- **Validation Logic**: `src/components/DiagramBuilder.tsx` (onConnect handler)

## DevOps Best Practices

These rules enforce:
1. **Separation of Concerns**: Each resource type has a specific purpose
2. **Standard Patterns**: Follow Kubernetes conventions
3. **Security**: Proper use of Secrets and ConfigMaps
4. **Scalability**: Correct HPA configuration
5. **Maintainability**: Clear, logical architecture

## Extending the Rules

To add new resource types or modify rules:
1. Update `K8sNodeType` in `src/types/k8s.ts`
2. Add connection rules in `src/utils/connectionRules.ts`
3. Document the rules in this file
4. Test the new connections thoroughly

---

**Note**: These rules are based on Kubernetes official documentation and DevOps industry best practices. They help prevent common configuration mistakes and ensure your infrastructure diagrams translate to valid, production-ready YAML manifests.
