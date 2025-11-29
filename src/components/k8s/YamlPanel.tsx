import { useState, useMemo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Download, Check, Package } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GeneratedYaml } from '@/types/k8s';

interface YamlPanelProps {
  yamls: GeneratedYaml;
}

type YamlTab = 'all' | 'ingresses' | 'services' | 'deployments' | 'configmaps' | 'secrets' | 'pvcs' | 'cronjobs' | 'hpas';

const tabs: { id: YamlTab; label: string; filePrefix: string }[] = [
  { id: 'all', label: 'All', filePrefix: 'all' },
  { id: 'ingresses', label: 'Ingress', filePrefix: 'ingress' },
  { id: 'services', label: 'Service', filePrefix: 'service' },
  { id: 'deployments', label: 'Deploy', filePrefix: 'deployment' },
  { id: 'configmaps', label: 'Config', filePrefix: 'configmap' },
  { id: 'secrets', label: 'Secret', filePrefix: 'secret' },
  { id: 'pvcs', label: 'PVC', filePrefix: 'pvc' },
  { id: 'cronjobs', label: 'CronJob', filePrefix: 'cronjob' },
  { id: 'hpas', label: 'HPA', filePrefix: 'hpa' },
];

export default function YamlPanel({ yamls }: YamlPanelProps) {
  const [activeTab, setActiveTab] = useState<YamlTab>('all');
  const [copied, setCopied] = useState(false);

  const currentYaml = useMemo(() => {
    if (activeTab === 'all') {
      const all = [
        ...yamls.configmaps,
        ...yamls.secrets,
        ...yamls.pvcs,
        ...yamls.deployments,
        ...yamls.services,
        ...yamls.ingresses,
        ...yamls.cronjobs,
        ...yamls.hpas,
      ];
      return all.length > 0 ? all.join('\n---\n') : '# Add resources to generate YAML';
    }
    const items = yamls[activeTab];
    return items.length > 0 ? items.join('\n---\n') : `# No ${activeTab} defined`;
  }, [yamls, activeTab]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(currentYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentYaml]);

  const handleDownload = useCallback(() => {
    const tab = tabs.find(t => t.id === activeTab);
    const filename = activeTab === 'all' ? 'k8s-manifests.yaml' : `${tab?.filePrefix}.yaml`;
    const blob = new Blob([currentYaml], { type: 'text/yaml' });
    saveAs(blob, filename);
  }, [currentYaml, activeTab]);

  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();
    
    if (yamls.ingresses.length > 0) {
      yamls.ingresses.forEach((y, i) => zip.file(`ingress-${i + 1}.yaml`, y));
    }
    if (yamls.services.length > 0) {
      yamls.services.forEach((y, i) => zip.file(`service-${i + 1}.yaml`, y));
    }
    if (yamls.deployments.length > 0) {
      yamls.deployments.forEach((y, i) => zip.file(`deployment-${i + 1}.yaml`, y));
    }
    if (yamls.configmaps.length > 0) {
      yamls.configmaps.forEach((y, i) => zip.file(`configmap-${i + 1}.yaml`, y));
    }
    if (yamls.secrets.length > 0) {
      yamls.secrets.forEach((y, i) => zip.file(`secret-${i + 1}.yaml`, y));
    }
    if (yamls.pvcs.length > 0) {
      yamls.pvcs.forEach((y, i) => zip.file(`pvc-${i + 1}.yaml`, y));
    }
    if (yamls.cronjobs.length > 0) {
      yamls.cronjobs.forEach((y, i) => zip.file(`cronjob-${i + 1}.yaml`, y));
    }
    if (yamls.hpas.length > 0) {
      yamls.hpas.forEach((y, i) => zip.file(`hpa-${i + 1}.yaml`, y));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'k8s-manifests.zip');
  }, [yamls]);

  const availableTabs = tabs.filter(t => {
    if (t.id === 'all') return true;
    return yamls[t.id].length > 0;
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex-col items-stretch gap-2">
        <div className="flex items-center justify-between">
          <span className="panel-title">Generated YAML</span>
          <div className="flex gap-1">
            <button onClick={handleCopy} className="btn-ghost p-1.5" title="Copy">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={handleDownload} className="btn-ghost p-1.5" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleDownloadZip} className="btn-ghost p-1.5" title="Download ZIP">
              <Package className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button whitespace-nowrap ${activeTab === tab.id ? 'tab-button-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="yaml"
          theme="vs-dark"
          value={currentYaml}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
