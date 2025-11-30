import { Node, Edge } from 'reactflow';
import { K8sNodeData } from '@/types/k8s';

const STORAGE_KEY = 'k8s-diagram-builder-state';
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

export interface DiagramState {
  nodes: Node<K8sNodeData>[];
  edges: Edge[];
  lastSaved: number;
}

/**
 * Save diagram state to localStorage
 */
export function saveDiagramState(nodes: Node<K8sNodeData>[], edges: Edge[]): void {
  try {
    const state: DiagramState = {
      nodes,
      edges,
      lastSaved: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save diagram state:', error);
  }
}

/**
 * Load diagram state from localStorage
 */
export function loadDiagramState(): DiagramState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as DiagramState;

    // Validate the loaded state has the expected structure
    if (!state.nodes || !state.edges || !Array.isArray(state.nodes) || !Array.isArray(state.edges)) {
      console.warn('Invalid diagram state in localStorage');
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load diagram state:', error);
    return null;
  }
}

/**
 * Clear saved diagram state
 */
export function clearDiagramState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear diagram state:', error);
  }
}

/**
 * Check if there's a saved diagram
 */
export function hasSavedDiagram(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get when the diagram was last saved
 */
export function getLastSavedTime(): Date | null {
  const state = loadDiagramState();
  return state ? new Date(state.lastSaved) : null;
}

/**
 * Create a debounced auto-save function
 */
export function createAutoSave(
  callback: (nodes: Node<K8sNodeData>[], edges: Edge[]) => void,
  delay: number = AUTO_SAVE_DELAY
): (nodes: Node<K8sNodeData>[], edges: Edge[]) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (nodes: Node<K8sNodeData>[], edges: Edge[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(nodes, edges);
      timeoutId = null;
    }, delay);
  };
}
