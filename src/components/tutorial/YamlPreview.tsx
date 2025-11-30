import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Editor from '@monaco-editor/react';

interface YamlPreviewProps {
  formData: Record<string, any>;
  currentStepId: string;
  completedSteps: Set<string>;
}

export default function YamlPreview({ formData, currentStepId, completedSteps }: YamlPreviewProps) {
  const { toast } = useToast();

  const generateYaml = (): string => {
    const yamls: string[] = [];

    // Generate YAML for each completed step + current step
    Object.entries(formData).forEach(([stepId, data]: [string, any]) => {
      if (!data || Object.keys(data).length === 0) return;

      // Determine resource type from stepId
      if (stepId.includes('deployment')) {
        yamls.push(generateDeploymentYaml(data));
      } else if (stepId.includes('service')) {
        yamls.push(generateServiceYaml(data));
      } else if (stepId.includes('ingress')) {
        yamls.push(generateIngressYaml(data));
      }
    });

    return yamls.length > 0 ? yamls.join('\n---\n') : '# Fill in the form to see YAML generated here...';
  };

  const generateDeploymentYaml = (data: any): string => {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${data.deploymentName || 'my-deployment'}
spec:
  replicas: ${data.replicas || 1}
  selector:
    matchLabels:
      app: ${data.deploymentName || 'my-app'}
  template:
    metadata:
      labels:
        app: ${data.deploymentName || 'my-app'}
    spec:
      containers:
      - name: ${data.containerName || 'container'}
        image: ${data.image || 'nginx:latest'}
        ports:
        - containerPort: ${data.containerPort || 80}`;
  };

  const generateServiceYaml = (data: any): string => {
    return `apiVersion: v1
kind: Service
metadata:
  name: ${data.serviceName || 'my-service'}
spec:
  type: ${data.serviceType || 'ClusterIP'}
  selector:
    app: ${formData['step-1-deployment']?.deploymentName || 'my-app'}
  ports:
  - port: ${data.port || 80}
    targetPort: ${data.targetPort || 80}
    protocol: TCP`;
  };

  const generateIngressYaml = (data: any): string => {
    const yaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${data.serviceName || 'my'}-ingress
spec:
  ingressClassName: ${data.ingressClassName || 'nginx'}`;

    const tlsSection = data.enableTLS ? `
  tls:
  - hosts:
    - ${data.host || 'example.com'}
    secretName: ${data.host?.replace(/\./g, '-') || 'example'}-tls` : '';

    const rulesSection = `
  rules:
  - host: ${data.host || 'example.com'}
    http:
      paths:
      - path: ${data.path || '/'}
        pathType: Prefix
        backend:
          service:
            name: ${data.serviceName || 'my-service'}
            port:
              number: ${data.servicePort || 80}`;

    return yaml + tlsSection + rulesSection;
  };

  const yaml = generateYaml();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    toast({
      title: 'Copied!',
      description: 'YAML copied to clipboard',
    });
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kubernetes-resources.yaml';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: 'YAML file saved',
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Live YAML Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={yaml.startsWith('#')}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={yaml.startsWith('#')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* YAML Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="yaml"
          value={yaml}
          theme="vs-light"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Info Footer */}
      <div className="bg-green-50 border-t border-green-200 px-4 py-3">
        <p className="text-sm text-green-800">
          {completedSteps.size > 0 ? (
            <>
              <strong>{completedSteps.size}</strong> resource{completedSteps.size !== 1 ? 's' : ''} configured.
              Complete all steps to build your full Kubernetes deployment!
            </>
          ) : (
            'Start filling in the form to see your YAML configuration build up step by step.'
          )}
        </p>
      </div>
    </Card>
  );
}
