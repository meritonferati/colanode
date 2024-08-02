import OrderedList from '@tiptap/extension-ordered-list';

import { defaultClasses } from '@/editor/classes';

export const OrderedListNode = OrderedList.configure({
  HTMLAttributes: {
    class: defaultClasses.orderedList,
  },
});
