import { Database } from '@/renderer/components/databases/database';
import { RecordAttributes } from '@/renderer/components/records/record-attributes';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { Document } from '@/renderer/components/documents/document';
import { Separator } from '@/renderer/components/ui/separator';
import { RecordProvider } from '@/renderer/components/records/record-provider';
import { RecordNode } from '@colanode/core';

interface RecordBodyProps {
  record: RecordNode;
}

export const RecordBody = ({ record }: RecordBodyProps) => {
  return (
    <Database databaseId={record.attributes.databaseId}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <RecordProvider record={record}>
          <RecordAttributes />
        </RecordProvider>
        <Separator className="my-4 w-full" />
        <Document
          nodeId={record.id}
          content={record.attributes.content}
          versionId={record.versionId}
        />
      </ScrollArea>
    </Database>
  );
};
