import React from 'react';

import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EmojiPicker } from '@/components/emojis/emoji-picker';

interface MessageReactionProps {
  onEmojiSelect: (emoji: string) => void;
  size?: string | number;
  className?: string;
}

export const MessageReactionPicker = ({
  size,
  className,
}: MessageReactionProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open} modal={true}>
      <PopoverTrigger asChild>
        <Icon name="emoji-sticker-line" size={size} className={className} />
      </PopoverTrigger>
      <PopoverContent className="w-max p-0" align="end">
        <EmojiPicker onEmojiClick={console.log} />
      </PopoverContent>
    </Popover>
  );
};
