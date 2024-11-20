import React from 'react';
import { MultiSelectFieldAttributes } from '@colanode/core';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/renderer/components/ui/popover';
import { SelectFieldOptions } from '@/renderer/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
import { useRecord } from '@/renderer/contexts/record';

interface RecordMultiSelectValueProps {
  field: MultiSelectFieldAttributes;
}

export const RecordMultiSelectValue = ({
  field,
}: RecordMultiSelectValueProps) => {
  const record = useRecord();

  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState(
    record.getMultiSelectValue(field)
  );

  React.useEffect(() => {
    setSelectedValues(record.getMultiSelectValue(field));
  }, [record.versionId]);

  const selectOptions = Object.values(field.options ?? {});
  const selectedOptions = selectOptions.filter((option) =>
    selectedValues.includes(option.id)
  );

  if (!record.canEdit) {
    return (
      <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-0">
        {selectedOptions?.map((option) => (
          <SelectOptionBadge
            key={option.id}
            name={option.name}
            color={option.color}
          />
        ))}
        {selectedOptions?.length === 0 && ' '}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-0">
          {selectedOptions?.map((option) => (
            <SelectOptionBadge
              key={option.id}
              name={option.name}
              color={option.color}
            />
          ))}
          {selectedOptions?.length === 0 && ' '}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={selectedValues}
          onSelect={(id) => {
            if (!record.canEdit) return;

            const newValues = selectedValues.includes(id)
              ? selectedValues.filter((v) => v !== id)
              : [...selectedValues, id];

            setSelectedValues(newValues);

            if (newValues.length === 0) {
              record.removeFieldValue(field);
            } else {
              record.updateFieldValue(field, {
                type: 'multiSelect',
                value: newValues,
              });
            }
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
