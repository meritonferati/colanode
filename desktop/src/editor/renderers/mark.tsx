import React from 'react';
import { defaultClasses } from '@/editor/classes';
import { NodeContentTree } from '@/types/nodes';

interface MarkRendererProps {
  node: NodeContentTree;
  children: any | any[];
}

export const MarkRenderer = ({ node, children }: MarkRendererProps) => {
  let result = <React.Fragment>{children}</React.Fragment>;

  if (node.marks) {
    node.marks.forEach((mark) => {
      if (mark.type === 'bold') {
        result = <strong>{result}</strong>;
      } else if (mark.type === 'italic') {
        result = <em>{result}</em>;
      } else if (mark.type === 'underline') {
        result = <u>{result}</u>;
      } else if (mark.type === 'strike') {
        result = <s>{result}</s>;
      } else if (mark.type === 'code') {
        result = <code className={defaultClasses.code}>{result}</code>;
      } else if (mark.type === 'color' && mark.attrs?.color) {
        result = (
          <span className={`text-${mark.attrs.color}-600`}>{result}</span>
        );
      } else if (mark.type === 'highlight' && mark.attrs?.highlight) {
        result = (
          <span className={`bg-${mark.attrs.highlight}-200`}>{result}</span>
        );
      } else if (mark.type === 'link' && mark.attrs?.href) {
        result = (
          <a
            href={mark.attrs.href}
            target="_blank"
            className={defaultClasses.link}
          >
            {result}
          </a>
        );
      }
    });
  }

  return result;
};
