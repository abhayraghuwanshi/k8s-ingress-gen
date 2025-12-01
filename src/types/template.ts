export interface TemplateItem {
  id: string;
  title: string;
  folder: string;
  path: string;
  tags: string[];
}

export const YAML_BASE = "https://abhayraghuwanshi.github.io/k8s-resource-library";
export const INDEX_URL = `${YAML_BASE}/index.json`;
