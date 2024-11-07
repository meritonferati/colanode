import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { ViewAttributes } from '@colanode/core';

interface ViewTabProps {
  view: ViewAttributes;
  isActive: boolean;
  onClick: () => void;
}

export const ViewTab = ({ view, isActive, onClick }: ViewTabProps) => {
  return (
    <div
      role="presentation"
      className={cn(
        'inline-flex cursor-pointer flex-row items-center gap-1 border-b-2 p-1 pl-0 text-sm',
        isActive ? 'border-gray-500' : 'border-transparent'
      )}
      onClick={() => onClick()}
      onKeyDown={() => onClick()}
    >
      <Avatar id={view.id} name={view.name} avatar={view.avatar} size="small" />
      {view.name}
    </div>
  );
};
