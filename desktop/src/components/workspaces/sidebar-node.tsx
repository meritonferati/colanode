import React from 'react';
import { Node } from '@/types/nodes';
import { match } from 'ts-pattern';
import { SpaceSidebarNode } from '@/components/spaces/space-sidebar-node';
import { NodeTypes } from '@/lib/constants';
import { ChannelSidebarNode } from '@/components/channels/channel-sidebar-node';
import { PageSidebarNode } from '@/components/pages/page-sidebar-node';

interface SidebarNodeProps {
  node: Node;
}

export const SidebarNode = ({ node }: SidebarNodeProps): React.ReactNode => {
  return match(node.type)
    .with(NodeTypes.Space, () => <SpaceSidebarNode node={node} />)
    .with(NodeTypes.Channel, () => <ChannelSidebarNode node={node} />)
    .with(NodeTypes.Page, () => <PageSidebarNode node={node} />)
    .otherwise(null);
};
