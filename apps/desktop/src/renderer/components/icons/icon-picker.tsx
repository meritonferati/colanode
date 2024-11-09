import React from 'react';
import { Icon } from '@/types/icons';
import { IconPickerContext } from '@/renderer/contexts/icon-picker';
import { IconPickerSearch } from '@/renderer/components/icons/icon-picker-search';
import { IconPickerBrowser } from '@/renderer/components/icons/icon-picker-browser';
import { useQuery } from '@/renderer/hooks/use-query';

interface IconPickerProps {
  onPick: (icon: Icon) => void;
}

export const IconPicker = ({ onPick }: IconPickerProps) => {
  const [query, setQuery] = React.useState('');
  const { data, isPending } = useQuery({ type: 'icons_get' });

  if (isPending || !data) {
    return null;
  }

  return (
    <IconPickerContext.Provider value={{ data, onPick }}>
      <div className="flex flex-col gap-1 p-1">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md bg-gray-100 p-2 text-xs focus:outline-none"
        />
        <div className="h-full min-h-[280px] w-full overflow-auto md:w-[350px]">
          {query.length > 2 ? (
            <IconPickerSearch query={query} />
          ) : (
            <IconPickerBrowser />
          )}
        </div>
      </div>
    </IconPickerContext.Provider>
  );
};
