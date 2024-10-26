export type ServerNodeDeleteMessageInput = {
  type: 'server_node_delete';
  id: string;
  workspaceId: string;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_node_delete: ServerNodeDeleteMessageInput;
  }
}
