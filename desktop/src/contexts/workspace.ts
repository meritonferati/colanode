import { createContext, useContext } from 'react';
import { Workspace } from "@/types/workspaces";
import {Node} from "@/types/nodes";

interface WorkspaceContext extends Workspace {
  addNode: (node: Node) => Promise<void>
  addNodes: (nodes: Node[]) => Promise<void>
  getNodes: () => Node[]
  updateNode: (node: Node) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  setContainerNode: (nodeId?: string | null) => void
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);

