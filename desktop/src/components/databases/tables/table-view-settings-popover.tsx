import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icon } from '@/components/ui/icon';
import { useTableView } from '@/contexts/table-view';
import { Separator } from '@/components/ui/separator';
import { useDatabase } from '@/contexts/database';
import { cn } from '@/lib/utils';
import { getFieldIcon } from '@/lib/databases';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FieldDeleteDialog } from '@/components/databases/fields/field-delete-dialog';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { ViewDeleteDialog } from '@/components/databases/view-delete-dialog';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { AttributeTypes } from '@/lib/constants';

export const TableViewSettingsPopover = () => {
  const tableView = useTableView();
  const database = useDatabase();
  const { mutate, isPending } = useNodeAttributeUpsertMutation();

  const [open, setOpen] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deleteFieldId, setDeleteFieldId] = React.useState<string | null>(null);

  const canEditDatabase = true;
  const canEditView = true;
  const canDeleteView = true;

  return (
    <React.Fragment>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
            <Icon name="settings-3-line" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="mr-4 flex w-[600px] flex-col gap-1.5 p-2">
          <SmartTextInput
            value={tableView.name}
            onChange={(newName) => {
              if (isPending) return;
              if (newName === tableView.name) return;

              mutate({
                nodeId: tableView.id,
                type: AttributeTypes.Name,
                key: '1',
                textValue: newName,
                numberValue: null,
                foreignNodeId: null,
              });
            }}
          />
          <Separator />
          <div className="flex flex-col gap-2 text-sm">
            <p className="my-1 font-semibold">Fields</p>
            {database.fields.map((field) => {
              const isHidden = tableView.isHiddenField(field.id);

              return (
                <div
                  key={field.id}
                  className={cn(
                    'flex flex-row items-center justify-between gap-2 p-0.5',
                    'cursor-pointer rounded-md hover:bg-gray-50',
                  )}
                >
                  <div className="flex flex-row items-center gap-2">
                    <Icon name={getFieldIcon(field.dataType)} />
                    <div>{field.name}</div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Icon
                          name={isHidden ? 'eye-off-line' : 'eye-line'}
                          className={
                            canEditView ? 'cursor-pointer' : 'opacity-50'
                          }
                          onClick={() => {
                            if (!canEditView) return;

                            if (isHidden) {
                              tableView.showField(field.id);
                            } else {
                              tableView.hideField(field.id);
                            }
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="flex flex-row items-center gap-2">
                        {isHidden
                          ? 'Show field in this view'
                          : 'Hide field from this view'}
                      </TooltipContent>
                    </Tooltip>
                    {canEditDatabase && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Icon
                            name="delete-bin-line"
                            onClick={() => {
                              setDeleteFieldId(field.id);
                              setOpen(false);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-row items-center gap-2">
                          Delete field from database
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {canEditView && canDeleteView && (
            <React.Fragment>
              <Separator />
              <div className="flex flex-col gap-2 text-sm">
                <p className="my-1 font-semibold">Settings</p>
                <div
                  className="flex cursor-pointer flex-row items-center gap-1 rounded-md p-0.5 hover:bg-gray-50"
                  onClick={() => {
                    setOpenDelete(true);
                    setOpen(false);
                  }}
                >
                  <Icon name="delete-bin-line" />
                  <span>Delete view</span>
                </div>
              </div>
            </React.Fragment>
          )}
        </PopoverContent>
      </Popover>
      {deleteFieldId && (
        <FieldDeleteDialog
          id={deleteFieldId}
          open={!!deleteFieldId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteFieldId(null);
            }
          }}
        />
      )}
      {openDelete && (
        <ViewDeleteDialog
          id={tableView.id}
          open={openDelete}
          onOpenChange={setOpenDelete}
        />
      )}
    </React.Fragment>
  );
};
