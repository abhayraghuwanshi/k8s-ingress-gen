import { useState, useMemo, useCallback } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Copy, Download, Check, Package, GitPullRequest } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GeneratedYaml } from '@/types/k8s';
import * as monaco from 'monaco-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Configure Monaco Editor to use self-hosted version instead of CDN
// This prevents tracking protection issues in browsers
loader.config({ monaco });

interface YamlPanelProps {
  yamls: GeneratedYaml;
}

type YamlTab = 'all' | 'ingresses' | 'services' | 'deployments' | 'configmaps' | 'secrets' | 'pvcs' | 'cronjobs' | 'hpas' | 'pods';

const tabs: { id: YamlTab; label: string; filePrefix: string }[] = [
  { id: 'all', label: 'All', filePrefix: 'all' },
  { id: 'ingresses', label: 'Ingress', filePrefix: 'ingress' },
  { id: 'services', label: 'Service', filePrefix: 'service' },
  { id: 'deployments', label: 'Deploy', filePrefix: 'deployment' },
  { id: 'pods', label: 'Pods', filePrefix: 'pod' },
  { id: 'configmaps', label: 'Config', filePrefix: 'configmap' },
  { id: 'secrets', label: 'Secret', filePrefix: 'secret' },
  { id: 'pvcs', label: 'PVC', filePrefix: 'pvc' },
  { id: 'cronjobs', label: 'CronJob', filePrefix: 'cronjob' },
  { id: 'hpas', label: 'HPA', filePrefix: 'hpa' },
];

export default function YamlPanel({ yamls }: YamlPanelProps) {
  const [activeTab, setActiveTab] = useState<YamlTab>('all');
  const [copied, setCopied] = useState(false);
  const [showPRDialog, setShowPRDialog] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateFolder, setTemplateFolder] = useState('');
  const [templateTags, setTemplateTags] = useState('');

  const currentYaml = useMemo(() => {
    if (activeTab === 'all') {
      const all = [
        ...yamls.configmaps,
        ...yamls.secrets,
        ...yamls.pvcs,
        ...yamls.pods,
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
    if (yamls.pods.length > 0) {
      yamls.pods.forEach((y, i) => zip.file(`pod-${i + 1}.yaml`, y));
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

  const handleCreatePR = useCallback(() => {
    if (!templateId || !templateTitle || !templateFolder) {
      alert('Please fill in all required fields (ID, Title, and Folder)');
      return;
    }

    const yamlText = currentYaml;
    const yamlTemplateEncoded = encodeURIComponent(yamlText);
    const id = templateId.trim();
    const title = templateTitle.trim();
    const folder = templateFolder.trim();

    const url = `https://github.com/abhayraghuwanshi/k8s-resource-library/new/main/${folder}?filename=${id}%2Fall.yaml&value=${yamlTemplateEncoded}&message=Add%20new%20template%20${id}&description=Automatically%20generated%20from%20k8sdiagram.fun%0A%0ATitle:%20${encodeURIComponent(title)}`;

    window.open(url, "_blank");
    setShowPRDialog(false);

    // Reset form
    setTemplateId('');
    setTemplateTitle('');
    setTemplateFolder('');
    setTemplateTags('');
  }, [currentYaml, templateId, templateTitle, templateFolder]);

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
            <button onClick={() => setShowPRDialog(true)} className="btn-ghost p-1.5" title="Create Template PR">
              <GitPullRequest className="w-4 h-4" />
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

      <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Template Pull Request</DialogTitle>
            <DialogDescription>
              Submit your K8s diagram as a template to the community library. Fill in the details below to create a GitHub PR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="label-text">
                Template ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., nginx-deployment"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier (lowercase, hyphens, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <label className="label-text">
                Template Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Nginx Deployment with ConfigMap"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A descriptive title for your template
              </p>
            </div>

            <div className="space-y-2">
              <label className="label-text">
                Folder Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., nginx-deployment"
                value={templateFolder}
                onChange={(e) => setTemplateFolder(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Folder name in the repository (usually same as template ID)
              </p>
            </div>

            <div className="space-y-2">
              <label className="label-text">Tags (optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., nginx, web, production"
                value={templateTags}
                onChange={(e) => setTemplateTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated tags for searchability
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPRDialog(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePR}
                className="btn-primary"
                disabled={!templateId || !templateTitle || !templateFolder}
              >
                Create Pull Request
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
