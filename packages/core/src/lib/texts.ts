import { Block } from '../registry/block';
import { EntryAttributes } from '../registry';
import { MessageContent } from '../types/messages';

export type TextResult = {
  id: string;
  name: string | null;
  text: string | null;
};

export const extractEntryText = (
  id: string,
  attributes: EntryAttributes
): TextResult | undefined => {
  if (attributes.type === 'page') {
    return {
      id,
      name: attributes.name,
      text: extractBlockTexts(id, attributes.content),
    };
  }

  if (attributes.type === 'record') {
    return {
      id,
      name: attributes.name,
      text: extractBlockTexts(id, attributes.content),
    };
  }

  return undefined;
};

export const extractMessageText = (
  id: string,
  content: MessageContent
): TextResult | undefined => {
  return {
    id,
    name: null,
    text: extractBlockTexts(id, content.blocks),
  };
};

const extractBlockTexts = (
  entryId: string,
  blocks: Record<string, Block> | undefined | null
): string | null => {
  if (!blocks) {
    return null;
  }

  const result = collectBlockText(entryId, blocks);
  return result.length > 0 ? result : null;
};

const collectBlockText = (
  blockId: string,
  blocks: Record<string, Block>
): string => {
  const texts: string[] = [];

  // Extract text from the current block's leaf nodes
  const block = blocks[blockId];
  if (block) {
    let text = '';
    if (block.content) {
      for (const leaf of block.content) {
        if (leaf.text) {
          text += leaf.text;
        }
      }
    }
    texts.push(text);
  }

  // Find children and sort them by their index to maintain a stable order
  const children = Object.values(blocks)
    .filter((child) => child.parentId === blockId)
    .sort((a, b) => a.index.localeCompare(b.index));

  // Recursively collect text from children
  for (const child of children) {
    texts.push(collectBlockText(child.id, blocks));
  }

  return texts.join('\n');
};
