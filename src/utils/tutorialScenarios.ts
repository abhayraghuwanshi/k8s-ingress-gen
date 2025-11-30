import { TutorialScenarioDefinition } from '@/types/tutorial';

/**
 * Simple Web App Tutorial
 * Teaches: Deployment -> Service -> Ingress
 * Perfect for beginners learning the basics
 */
export const simpleWebAppScenario: TutorialScenarioDefinition = {
  id: 'simple-web-app',
  title: 'Deploy a Simple Web App',
  description: 'Learn to deploy a web application with external access',
  duration: '5-10 minutes',
  steps: [
    {
      id: 'step-1-deployment',
      title: 'Step 1: Create a Deployment',
      description: 'Deploy your application container to Kubernetes',
      resourceType: 'deployment',
      explanation: 'A Deployment runs your application in containers (pods) and keeps them running. It ensures the desired number of replicas are always available.',
      eli5: 'Think of a Deployment like a toy box manager. It makes sure you always have the right number of your favorite toy cars (containers) ready to play with. If one breaks, the manager gets you a new one!',
      tips: [
        'Start with 2 replicas for high availability',
        'Use specific image tags, not "latest"',
        'Container port must match what your app listens on'
      ],
      fields: [
        {
          name: 'deploymentName',
          label: 'Deployment Name',
          type: 'text',
          required: true,
          placeholder: 'my-web-app',
          defaultValue: 'web-app',
          helpText: 'A unique name to identify this deployment',
          example: 'frontend, api-server, web-app'
        },
        {
          name: 'containerName',
          label: 'Container Name',
          type: 'text',
          required: true,
          placeholder: 'nginx',
          defaultValue: 'web-container',
          helpText: 'Name for the container inside the pod',
          example: 'app, server, web'
        },
        {
          name: 'image',
          label: 'Docker Image',
          type: 'text',
          required: true,
          placeholder: 'nginx:1.25',
          defaultValue: 'nginx:1.25',
          helpText: 'The container image to run from Docker Hub or registry',
          example: 'nginx:1.25, node:18-alpine, myregistry.io/myapp:v1.0'
        },
        {
          name: 'replicas',
          label: 'Number of Replicas',
          type: 'number',
          required: true,
          defaultValue: 2,
          helpText: 'How many copies of your app to run (for redundancy)',
          example: '1 for dev, 2-3 for production'
        },
        {
          name: 'containerPort',
          label: 'Container Port',
          type: 'number',
          required: true,
          placeholder: '80',
          defaultValue: 80,
          helpText: 'The port your application listens on inside the container',
          example: '80 for HTTP, 443 for HTTPS, 8080 for Node.js'
        }
      ]
    },
    {
      id: 'step-2-service',
      title: 'Step 2: Create a Service',
      description: 'Expose your deployment so other resources can connect',
      resourceType: 'service',
      explanation: 'A Service provides a stable network endpoint for your pods. Even if pods restart with new IPs, the Service stays the same.',
      eli5: 'A Service is like your home address. Even if you move to different rooms (pods moving around), your friends can always mail you letters to the same address!',
      tips: [
        'Service name will be used by Ingress to route traffic',
        'Port is what clients connect to, targetPort is the container port',
        'ClusterIP works for internal apps, LoadBalancer for external'
      ],
      fields: [
        {
          name: 'serviceName',
          label: 'Service Name',
          type: 'text',
          required: true,
          placeholder: 'web-app-service',
          defaultValue: 'web-app-service',
          helpText: 'Unique name for this service (used by Ingress)',
          example: 'frontend-svc, api-service'
        },
        {
          name: 'port',
          label: 'Service Port',
          type: 'number',
          required: true,
          placeholder: '80',
          defaultValue: 80,
          helpText: 'The port clients use to connect to this service',
          example: '80 for HTTP, 443 for HTTPS'
        },
        {
          name: 'targetPort',
          label: 'Target Port',
          type: 'number',
          required: true,
          placeholder: '80',
          defaultValue: 80,
          helpText: 'The container port to forward traffic to (from Step 1)',
          example: 'Should match container port from Deployment'
        },
        {
          name: 'serviceType',
          label: 'Service Type',
          type: 'select',
          required: true,
          defaultValue: 'ClusterIP',
          options: [
            { value: 'ClusterIP', label: 'ClusterIP (Internal only)' },
            { value: 'NodePort', label: 'NodePort (External via node)' },
            { value: 'LoadBalancer', label: 'LoadBalancer (Cloud LB)' }
          ],
          helpText: 'How the service is exposed',
          example: 'ClusterIP for internal, LoadBalancer for cloud'
        }
      ]
    },
    {
      id: 'step-3-ingress',
      title: 'Step 3: Create an Ingress',
      description: 'Expose your service to the internet with a domain',
      resourceType: 'ingress',
      explanation: 'An Ingress routes external HTTP/HTTPS traffic to your services based on domain names and paths. It acts as a reverse proxy.',
      eli5: 'An Ingress is like a mailman who knows all the addresses in the neighborhood. When someone visits "myapp.com", the mailman knows exactly which house (service) to deliver the visitor to!',
      tips: [
        'Host should be a domain you own or can configure',
        'Enable TLS for production apps (HTTPS)',
        'Path "/" routes all traffic to your service'
      ],
      fields: [
        {
          name: 'host',
          label: 'Domain Name',
          type: 'text',
          required: true,
          placeholder: 'myapp.example.com',
          defaultValue: 'myapp.example.com',
          helpText: 'The domain users will visit to access your app',
          example: 'myapp.com, api.example.com, app.mydomain.io'
        },
        {
          name: 'path',
          label: 'Path',
          type: 'text',
          required: true,
          placeholder: '/',
          defaultValue: '/',
          helpText: 'URL path to match (/ means all paths)',
          example: '/ for all, /api for API only'
        },
        {
          name: 'serviceName',
          label: 'Backend Service',
          type: 'text',
          required: true,
          placeholder: 'web-app-service',
          defaultValue: 'web-app-service',
          helpText: 'Service to route traffic to (from Step 2)',
          example: 'Must match the service name you created'
        },
        {
          name: 'servicePort',
          label: 'Service Port',
          type: 'number',
          required: true,
          placeholder: '80',
          defaultValue: 80,
          helpText: 'Service port to forward to (from Step 2)',
          example: 'Should match service port'
        },
        {
          name: 'ingressClassName',
          label: 'Ingress Controller',
          type: 'text',
          required: true,
          placeholder: 'nginx',
          defaultValue: 'nginx',
          helpText: 'The ingress controller handling requests',
          example: 'nginx, traefik, istio'
        },
        {
          name: 'enableTLS',
          label: 'Enable HTTPS (TLS)',
          type: 'toggle',
          required: false,
          defaultValue: false,
          helpText: 'Enable secure HTTPS connections',
          example: 'Recommended for production'
        }
      ]
    }
  ]
};

export const tutorialScenarios = [simpleWebAppScenario];
