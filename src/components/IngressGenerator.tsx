import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Copy, Download, Check, Terminal } from 'lucide-react';

interface IngressConfig {
  domain: string;
  serviceName: string;
  servicePort: number;
  path: string;
  ingressClassName: string;
  tlsEnabled: boolean;
  tlsSecretName: string;
}

const defaultConfig: IngressConfig = {
  domain: 'example.com',
  serviceName: 'my-service',
  servicePort: 80,
  path: '/',
  ingressClassName: 'nginx',
  tlsEnabled: false,
  tlsSecretName: '',
};

function generateYAML(config: IngressConfig): string {
  const { domain, serviceName, servicePort, path, ingressClassName, tlsEnabled, tlsSecretName } = config;
  
  let yaml = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${serviceName}-ingress
spec:
  ingressClassName: ${ingressClassName}`;

  if (tlsEnabled) {
    yaml += `
  tls:
    - hosts:
        - ${domain}
      secretName: ${tlsSecretName || `${serviceName}-tls`}`;
  }

  yaml += `
  rules:
    - host: ${domain}
      http:
        paths:
          - path: ${path}
            pathType: Prefix
            backend:
              service:
                name: ${serviceName}
                port:
                  number: ${servicePort}`;

  return yaml;
}

export default function IngressGenerator() {
  const [config, setConfig] = useState<IngressConfig>(defaultConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [yaml, setYaml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleChange = (field: keyof IngressConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = useCallback(() => {
    const generatedYaml = generateYAML(config);
    setYaml(generatedYaml);
  }, [config]);

  const handleCopy = useCallback(async () => {
    if (!yaml) return;
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [yaml]);

  const handleDownload = useCallback(() => {
    if (!yaml) return;
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ingress.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [yaml]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              K8s Ingress Generator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Generate Kubernetes Ingress YAML configurations with minimal input
          </p>
        </header>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          {/* Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label-text">Domain Name</label>
              <input
                type="text"
                className="input-field"
                value={config.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="example.com"
              />
            </div>
            <div>
              <label className="label-text">Service Name</label>
              <input
                type="text"
                className="input-field"
                value={config.serviceName}
                onChange={(e) => handleChange('serviceName', e.target.value)}
                placeholder="my-service"
              />
            </div>
            <div>
              <label className="label-text">Service Port</label>
              <input
                type="number"
                className="input-field"
                value={config.servicePort}
                onChange={(e) => handleChange('servicePort', parseInt(e.target.value) || 80)}
                placeholder="80"
              />
            </div>
            <div>
              <label className="label-text">Path</label>
              <input
                type="text"
                className="input-field"
                value={config.path}
                onChange={(e) => handleChange('path', e.target.value)}
                placeholder="/"
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            className="toggle-section mb-4"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Advanced Options</span>
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="animate-fade-in border-t border-border pt-4 space-y-4">
              <div>
                <label className="label-text">Ingress Class Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={config.ingressClassName}
                  onChange={(e) => handleChange('ingressClassName', e.target.value)}
                  placeholder="nginx"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="label-text mb-0">TLS Enabled</label>
                <button
                  type="button"
                  onClick={() => handleChange('tlsEnabled', !config.tlsEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    config.tlsEnabled ? 'bg-primary' : 'bg-input'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-foreground rounded-full transition-transform duration-200 ${
                      config.tlsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {config.tlsEnabled && (
                <div className="animate-fade-in">
                  <label className="label-text">TLS Secret Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={config.tlsSecretName}
                    onChange={(e) => handleChange('tlsSecretName', e.target.value)}
                    placeholder={`${config.serviceName}-tls`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use default: {config.serviceName}-tls
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-6">
            <button type="button" className="btn-primary w-full md:w-auto" onClick={handleGenerate}>
              Generate YAML
            </button>
          </div>
        </div>

        {/* YAML Output */}
        {yaml && (
          <div className="bg-card border border-border rounded-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Generated YAML</h2>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button type="button" className="btn-secondary" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <textarea
              readOnly
              className="yaml-output"
              value={yaml}
            />
          </div>
        )}
      </div>
    </div>
  );
}
