import React from 'react';
import isHotkey from 'is-hotkey';

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { LocalNode } from '@/types/nodes';
import { NeuronId } from '@/lib/id';

const getTextValue = (record: LocalNode, field: LocalNode): string => {
  const attrs = record.attrs;

  if (!attrs) {
    return '';
  }

  const fieldValue = attrs[field.id];

  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  return '';
};

interface TableViewTextCellProps {
  record: LocalNode;
  field: LocalNode;
  className?: string;
}

export const TableViewTextCell = ({
  record,
  field,
  className,
}: TableViewTextCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: string) => {
      const newAttrs = {
        ...record.attrs,
        [field.id]: newValue,
      };
      const query = workspace.schema
        .updateTable('nodes')
        .set({
          attrs: newAttrs ? JSON.stringify(newAttrs) : null,
          updated_at: new Date().toISOString(),
          updated_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .where('id', '=', record.id)
        .compile();

      await workspace.mutate(query);
    },
  });

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getTextValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getTextValue(record, field) ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: string, previous: string | null) => {
    if (current.length && current !== previous) {
      mutate(current);
    }
  };

  return (
    <input
      readOnly={!canEdit || isPending}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => saveIfChanged(text, getTextValue(record, field))}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          saveIfChanged(text, getTextValue(record, field));
          e.preventDefault();
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
    />
  );
};
