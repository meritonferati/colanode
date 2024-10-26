import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Button } from '@/renderer/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import { Icon } from '@/renderer/components/ui/icon';
import { getFieldIcon } from '@/lib/databases';
import { FieldDataType } from '@/types/databases';
import { cn } from '@/lib/utils';

interface FieldTypeOption {
  name: string;
  dataType: FieldDataType;
}

const fieldTypes: FieldTypeOption[] = [
  {
    name: 'Boolean',
    dataType: 'boolean',
  },
  {
    name: 'Collaborator',
    dataType: 'collaborator',
  },
  {
    name: 'Created Date & Time',
    dataType: 'created_at',
  },
  {
    name: 'Created by user',
    dataType: 'created_by',
  },
  {
    name: 'Date',
    dataType: 'date',
  },
  {
    name: 'Email',
    dataType: 'email',
  },
  {
    name: 'File',
    dataType: 'file',
  },
  {
    name: 'Multi Select',
    dataType: 'multi_select',
  },
  {
    name: 'Number',
    dataType: 'number',
  },
  {
    name: 'Phone',
    dataType: 'phone',
  },
  {
    name: 'Select',
    dataType: 'select',
  },
  {
    name: 'Text',
    dataType: 'text',
  },
  {
    name: 'Url',
    dataType: 'url',
  },
];

interface FieldDataTypeSelectProps {
  dataType: string | null;
  onChange: (type: FieldDataType) => void;
}

export const FieldDataTypeSelect = ({
  dataType,
  onChange,
}: FieldDataTypeSelectProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between p-2"
        >
          <span className="flex flex-row items-center gap-1">
            <Icon name={getFieldIcon(dataType as FieldDataType)} />
            {dataType
              ? fieldTypes.find((fieldType) => fieldType.dataType === dataType)
                  ?.name
              : 'Select field type...'}
          </span>
          <Icon
            name="expand-up-down-line"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min">
          <CommandInput placeholder="Search field types..." className="h-9" />
          <CommandEmpty>No field type found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {fieldTypes.map((fieldType) => (
                <CommandItem
                  key={fieldType.dataType}
                  onSelect={() => {
                    onChange(fieldType.dataType);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Icon name={getFieldIcon(fieldType.dataType)} />
                    <p>{fieldType.name}</p>
                    <Icon
                      name="check-line"
                      className={cn(
                        'ml-auto h-4 w-4',
                        dataType === fieldType.dataType
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
