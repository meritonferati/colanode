// import { MessageNode } from '@/shared/types/messages';
// import { MessageAuthorAvatar } from '@/renderer/components/messages/message-author-avatar';
// import { MessageAuthorName } from '@/renderer/components/messages/message-author-name';
// import { MessageContent } from '@/renderer/components/messages/message-content';
// import { useWorkspace } from '@/renderer/contexts/workspace';
// import { useQuery } from '@/renderer/hooks/use-query';

// interface MessageReferenceProps {
//   messageId: string;
// }

// export const MessageReference = ({ messageId }: MessageReferenceProps) => {
//   const workspace = useWorkspace();
//   const { data } = useQuery({
//     type: 'node_get',
//     nodeId: messageId,
//     userId: workspace.userId,
//   });

//   if (!data || data.type !== 'message') {
//     return null;
//   }

//   const message = data as MessageNode;

//   return (
//     <div className="flex flex-row gap-2 border-l-4 p-2">
//       <MessageAuthorAvatar message={message} className="size-5 mt-1" />
//       <div className='"flex-grow flex-col gap-1'>
//         <MessageAuthorName message={message} />
//         <MessageContent message={message} />
//       </div>
//     </div>
//   );
// };
