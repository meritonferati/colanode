import React from 'react';
import { Node } from '@/types/nodes';
import { SidebarNode } from '@/components/workspaces/sidebar-node';
import { useSidebar } from '@/contexts/sidebar';

interface SidebarNodeChildrenProps {
  node: Node;
}

export const SidebarNodeChildren = ({ node }: SidebarNodeChildrenProps) => {
  const sidebar = useSidebar();
  const children: Node[] = sidebar.nodes
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      } else if (a.index > b.index) {
        return 1;
      }

      return 0;
    });

  return (
    <React.Fragment>
      {children.map((child) => (
        <SidebarNode key={child.id} node={child} />
      ))}
    </React.Fragment>
  );
};
