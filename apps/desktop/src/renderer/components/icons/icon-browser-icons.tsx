import { IconPickerIconRow } from '@/shared/types/icons';
import { useQuery } from '@/renderer/hooks/use-query';
import { IconPickerItem } from '@/renderer/components/icons/icon-picker-item';

interface IconBrowserIconsProps {
  row: IconPickerIconRow;
  style: React.CSSProperties;
}

export const IconBrowserIcons = ({ row, style }: IconBrowserIconsProps) => {
  const { data } = useQuery({
    type: 'icon_list',
    category: row.category,
    page: row.page,
    count: row.count,
  });

  const icons = data ?? [];
  return (
    <div className="flex flex-row gap-1" style={style}>
      {icons.map((icon) => (
        <IconPickerItem key={icon.id} icon={icon} />
      ))}
    </div>
  );
};
