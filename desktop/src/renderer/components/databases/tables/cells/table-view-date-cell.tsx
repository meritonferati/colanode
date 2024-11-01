import React from 'react';
import { DateFieldAttributes } from '@/registry';
import { DatePicker } from '@/renderer/components/ui/date-picker';
import { useRecord } from '@/renderer/contexts/record';

interface TableViewDateCellProps {
  field: DateFieldAttributes;
}

export const TableViewDateCell = ({ field }: TableViewDateCellProps) => {
  const record = useRecord();

  return (
    <DatePicker
      value={record.getDateValue(field)}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === null || newValue === undefined) {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'date',
            value: newValue.toISOString(),
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
