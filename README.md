# K8s Diagram Generator

A visual diagram builder for Kubernetes resources with bidirectional YAML workflow. Create K8s infrastructure diagrams visually and export to production-ready YAML manifests, or import existing YAML to generate diagrams.

**Live Demo**: [k8sdiagram.fun](https://k8sdiagram.fun)

## Features

### Visual Diagram Builder
- **Drag-and-drop interface** for creating K8s resources
- **Real-time YAML generation** as you build
- **Automatic connection inference** between resources
- **Interactive node properties panel** for configuration
- **Multi-resource support**: Ingress, Service, Deployment, Pod, ConfigMap, Secret, PVC, CronJob, HPA, Sidecar

### Template Library
- **Community template repository** hosted on GitHub Pages
- **Search and filter** templates by title and tags
- **One-click import** from curated template library
- **Automatic diagram generation** from templates

### Bidirectional YAML Workflow

#### Generate YAML from Diagram
- Export individual resource types (Ingress, Service, etc.)
- Export all resources as single file or ZIP archive
- Copy to clipboard or download
- Production-ready YAML with proper K8s syntax

#### Import YAML to Diagram
- Upload existing YAML files
- Automatic parsing of multi-document YAML
- Auto-generated node connections based on:
  - Ingress → Service (backend references)
  - Service → Deployment/Pod (selector matching)
  - Deployment → ConfigMap/Secret (envFrom, env.valueFrom)
  - Deployment → PVC (volume mounts)
  - HPA → Deployment (scaleTargetRef)

### PR Contribution Feature
- **Contribute templates to community library** via GitHub Pull Requests
- Built-in dialog for template metadata (ID, title, folder, tags)
- Automatic PR creation with pre-filled YAML content
- One-click submission to k8s-resource-library repository

### Cloud Provider Integration
- **Template-based cloud provider support** for Deployments, Secrets, and PVCs
- **AWS, GCP, Azure templates** with provider-specific annotations
- **Sidecar containers** for cloud-native patterns (Cloud SQL Proxy, AWS Secrets Manager, etc.)

## Technology Stack

- **React** with TypeScript
- **React Flow** for diagram visualization
- **Monaco Editor** for YAML editing
- **js-yaml** for YAML parsing and generation
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **Vite** for build tooling

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/k8s-ingress-gen.git

# Navigate to project directory
cd k8s-ingress-gen

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

## Usage Guide

### Creating a Diagram from Scratch

1. **Open the Node Palette** (left sidebar)
2. **Click "Build from Scratch"** to expand resource options
3. **Click a resource type** (e.g., Deployment) to add it to the canvas
4. **Configure the node** in the Properties Panel (right sidebar)
5. **Connect nodes** by dragging from one node's edge to another
6. **View generated YAML** in the YAML Panel (right panel)

### Using Templates

1. **Open the Node Palette** (left sidebar)
2. **Click "Templates"** to expand template library
3. **Search templates** by title or tags
4. **Click a template** to load it into the diagram
5. **Customize** the imported nodes as needed

### Importing YAML

1. **Click the Upload button** in the toolbar
2. **Select a YAML file** from your computer
3. **Diagram automatically generates** with all resources and connections
4. **Edit visually** or update properties

### Exporting YAML

1. **Click tabs** in YAML Panel to view different resource types
2. **Copy to clipboard** with the Copy button
3. **Download individual file** with Download button
4. **Download all resources as ZIP** with Package button

### Contributing Templates

1. **Build your diagram** with the resources you want to share
2. **Click the PR button** (GitPullRequest icon) in YAML Panel
3. **Fill in template details**:
   - Template ID (unique identifier, lowercase-hyphenated)
   - Title (descriptive name)
   - Folder (usually same as ID)
   - Tags (comma-separated for searchability)
4. **Click "Create Pull Request"** to open GitHub with pre-filled PR
5. **Submit PR** to the k8s-resource-library repository

## Architecture

### Project Structure

```
src/
├── components/
│   ├── DiagramBuilder.tsx       # Main orchestrator component
│   ├── k8s/
│   │   ├── NodePalette.tsx      # Left sidebar (resources + templates)
│   │   ├── YamlPanel.tsx        # Right panel (YAML viewer + export)
│   │   ├── PropertiesPanel.tsx  # Right sidebar (node configuration)
│   │   └── K8sNode.tsx          # Custom node component
│   └── ui/                      # shadcn/ui components
├── types/
│   ├── k8s.ts                   # K8s resource TypeScript interfaces
│   └── template.ts              # Template system types
├── utils/
│   ├── yamlGenerator.ts         # Diagram → YAML conversion
│   ├── yamlParser.ts            # YAML → Diagram conversion
│   └── templates.ts             # Built-in diagram templates
└── hooks/
    └── useYamlGenerator.ts      # YAML generation hook
```

### Adding New K8s Resource Types

To add a new resource type (e.g., StatefulSet):

1. **Update `src/types/k8s.ts`**: Add interface extending `BaseK8sNodeData`
2. **Update `src/utils/yamlGenerator.ts`**: Add generation function (e.g., `generateStatefulSetYaml`)
3. **Update `src/components/k8s/PropertiesPanel.tsx`**: Add property editor section
4. **Update `src/components/k8s/NodePalette.tsx`**: Add to resource list
5. **Update `src/components/k8s/YamlPanel.tsx`**: Add tab and file prefix
6. **Update `src/utils/yamlParser.ts`**: Add parsing logic in `convertResourceToNodeData`

See `CLAUDE.md` for detailed file map and instructions.

## Template Library

Templates are hosted in a separate GitHub Pages repository: [k8s-resource-library](https://github.com/abhayraghuwanshi/k8s-resource-library)

### Template Structure

```json
{
  "templates": [
    {
      "id": "nginx-deployment",
      "title": "Nginx Deployment with ConfigMap",
      "folder": "nginx-deployment",
      "path": "nginx-deployment/all.yaml",
      "tags": ["nginx", "web", "production"]
    }
  ]
}
```

Each template folder contains:
- `all.yaml` - Multi-document YAML with all resources
- `README.md` - Template documentation

## Connection Rules

Automatic connections are created based on K8s resource relationships:

- **Ingress → Service**: Via `backend.service.name` in ingress rules
- **Service → Deployment/Pod**: Via label selector matching
- **Deployment → ConfigMap**: Via `envFrom.configMapRef` or `env.valueFrom.configMapKeyRef`
- **Deployment → Secret**: Via `envFrom.secretRef` or `env.valueFrom.secretKeyRef`
- **Deployment → PVC**: Via `volumes.persistentVolumeClaim.claimName`
- **HPA → Deployment**: Via `scaleTargetRef.name`

See `CONNECTION_RULES.md` for complete documentation.

## Critical Implementation Notes

### Array Initialization
All array fields in parsed YAML must be initialized to prevent crashes:

```typescript
envVars: (container?.env || []).map(...),  // Never undefined
labels: [...] || [],
volumeMounts: [],
annotations: []
```

### Sidecar Structure
Sidecar nodes require specific interface:

```typescript
{
  type: 'sidecar',
  containerName: string,
  containerType: 'sidecar' | 'init',
  purpose: 'proxy' | 'logging' | 'monitoring' | 'custom',
  containerPort?: number,
  envVars: KeyValue[],
  volumeMounts: VolumeMount[],
  cloudProvider: CloudProvider
}
```

### Template Validation
Templates must conform to strict K8s YAML syntax and include proper metadata (name, labels, selectors).

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Template library powered by GitHub Pages
- Icons from [Lucide React](https://lucide.dev)
- YAML editing powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/k8s-ingress-gen/issues)
- Documentation: See `CLAUDE.md` for development guide
- Tutorial: See `TUTORIAL_FEATURE.md` for user guide

---

**Built with care for the K8s community** | [k8sdiagram.fun](https://k8sdiagram.fun)
