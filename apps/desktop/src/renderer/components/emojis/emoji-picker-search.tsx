import React from 'react';
import { searchEmojis } from '@/lib/emojis';
import { EmojiPickerItem } from '@/renderer/components/emojis/emoji-picker-item';
import { useEmojiPicker } from '@/renderer/contexts/emoji-picker';

interface EmojiPickerSearchProps {
  query: string;
}

export const EmojiPickerSearch = ({ query }: EmojiPickerSearchProps) => {
  const { data } = useEmojiPicker();

  const filteredEmojis = React.useMemo(() => {
    return searchEmojis(query, data);
  }, [query]);

  return (
    <div className="grid h-full min-h-full w-full min-w-full grid-cols-10 gap-1">
      <div className="col-span-full flex items-center py-1 pl-1 text-sm text-muted-foreground">
        <p>Search results for "{query}"</p>
      </div>
      {filteredEmojis.map((emoji) => (
        <EmojiPickerItem key={emoji.id} emoji={emoji} />
      ))}
    </div>
  );
};
