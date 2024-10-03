import React from 'react';
import { RecordNode, SelectFieldNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface RecordSelectValueProps {
  record: RecordNode;
  field: SelectFieldNode;
}

export const RecordSelectValue = ({
  record,
  field,
}: RecordSelectValueProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    record.attributes[field.id] ?? '',
  );

  React.useEffect(() => {
    setSelectedValue(record.attributes[field.id] ?? '');
  }, [record.versionId]);

  const selectedOption = field.options?.find(
    (option) => option.id === selectedValue,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="h-full w-full cursor-pointer p-1">
          {selectedOption ? (
            <SelectOptionBadge
              name={selectedOption.name}
              color={selectedOption.color}
            />
          ) : (
            ' '
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={[selectedValue]}
          onSelect={(id) => {
            if (isPending) {
              return;
            }

            if (selectedValue === id) {
              setSelectedValue('');
              mutate({
                input: {
                  type: 'node_attribute_delete',
                  nodeId: record.id,
                  attribute: field.id,
                  userId: workspace.userId,
                },
              });
            } else {
              mutate({
                input: {
                  type: 'node_attribute_set',
                  nodeId: record.id,
                  attribute: field.id,
                  value: id,
                  userId: workspace.userId,
                },
                onSuccess() {
                  setOpen(false);
                },
              });
            }
            setSelectedValue(id);
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
