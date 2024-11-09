import React from 'react';
import { EmojiSkinToneSelector } from '@/renderer/components/emojis/emoji-skin-tone-selector';
import { Emoji } from '@/types/emojis';
import { EmojiPickerContext } from '@/renderer/contexts/emoji-picker';
import { EmojiPickerBrowser } from '@/renderer/components/emojis/emoji-picker-browser';
import { EmojiPickerSearch } from '@/renderer/components/emojis/emoji-picker-search';
import { useQuery } from '@/renderer/hooks/use-query';

interface EmojiPickerProps {
  onPick: (emoji: Emoji, skinTone: number) => void;
}

export const EmojiPicker = ({ onPick }: EmojiPickerProps) => {
  const [query, setQuery] = React.useState('');
  const [skinTone, setSkinTone] = React.useState(0);
  const { data, isPending } = useQuery({ type: 'emojis_get' });

  if (isPending || !data) {
    return null;
  }

  return (
    <EmojiPickerContext.Provider
      value={{ data, skinTone, onPick: (emoji) => onPick(emoji, skinTone) }}
    >
      <div className="flex flex-col gap-1 p-1">
        <div className="flex flex-row items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md bg-gray-100 p-2 text-xs focus:outline-none"
          />
          <EmojiSkinToneSelector
            skinTone={skinTone}
            onSkinToneChange={setSkinTone}
          />
        </div>
        <div className="h-full min-h-[280px] w-full overflow-auto md:w-[350px]">
          {query.length > 2 ? (
            <EmojiPickerSearch query={query} />
          ) : (
            <EmojiPickerBrowser />
          )}
        </div>
      </div>
    </EmojiPickerContext.Provider>
  );
};
