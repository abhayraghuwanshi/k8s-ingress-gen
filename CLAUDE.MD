Refer: CONNECTION_RULES.MDD
Refer: SEO_GUIDE.MD
Refer: TUTORIAL_FEATURE.md
Refer: CONNECTION_RULES.MD

# Project Memory

## Template System (Dec 2025)
- **Left Sidebar**: "Build from Scratch" + "Templates from GitHub"
- **Source**: `abhayraghuwanshi.github.io/k8s-resource-library/index.json`
- **YAML Parser**: Auto-creates connections (Ingress→Service, Service→Deployment, etc)
- **Files**: `src/types/template.ts`, `src/utils/yamlParser.ts`, `src/components/k8s/NodePalette.tsx`

## PR Contribution
- **YamlPanel**: GitPullRequest button → dialog → opens GitHub PR
- **Encodes YAML** + template metadata → pre-filled GitHub file creation

## Critical Notes
- All arrays MUST be initialized (never `undefined`)
- Sidecar nodes: use `containerName`, `containerType`, `envVars[]`, `volumeMounts[]`
- Match TypeScript K8sNodeData interfaces exactly

## File Map

### Add New K8s Resource Type
1. `src/types/k8s.ts` - Add interface to K8sNodeData union
2. `src/components/k8s/K8sNode.tsx` - Add rendering logic
3. `src/components/k8s/NodePalette.tsx` - Add to paletteItems array
4. `src/utils/yamlGenerator.ts` - Add YAML generation function
5. `src/utils/yamlParser.ts` - Add to mapKindToNodeType() + convertResourceToNodeData()
6. `src/components/k8s/PropertiesPanel.tsx` - Add properties form section

### Core Structure
- **Types**: `src/types/` (k8s.ts, template.ts)
- **Components**: `src/components/k8s/` (nodes, panels, dialogs)
- **Utilities**: `src/utils/` (YAML gen/parse, templates, storage)
- **Main**: `src/components/DiagramBuilder.tsx` (orchestration)
- **UI**: `src/components/ui/` (shadcn components)