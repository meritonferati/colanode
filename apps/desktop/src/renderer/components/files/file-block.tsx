import { FilePreview } from '@/renderer/components/files/file-preview';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useLayout } from '@/renderer/contexts/layout';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const { data } = useQuery({
    type: 'file_get',
    id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!data) {
    return null;
  }

  return (
    <div
      className="flex h-72 max-h-72 max-w-128 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
      onClick={() => {
        layout.previewLeft(id, true);
      }}
    >
      <FilePreview file={data} />
    </div>
  );
};
