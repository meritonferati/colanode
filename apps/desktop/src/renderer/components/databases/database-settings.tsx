import { DatabaseEntry, EntryRole, hasEntryRole } from '@colanode/core';
import { Copy, Image, LetterText, Settings, Trash2 } from 'lucide-react';
import React from 'react';

import { EntryCollaboratorAudit } from '@/renderer/components/collaborators/entry-collaborator-audit';
import { DatabaseDeleteDialog } from '@/renderer/components/databases/database-delete-dialog';
import { DatabaseUpdateDialog } from '@/renderer/components/databases/database-update-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';

interface DatabaseSettingsProps {
  database: DatabaseEntry;
  role: EntryRole;
}

export const DatabaseSettings = ({ database, role }: DatabaseSettingsProps) => {
  const [showUpdateDialog, setShowUpdateDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteModal] = React.useState(false);

  const canEdit = hasEntryRole(role, 'editor');
  const canDelete = hasEntryRole(role, 'admin');

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-4 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-80">
          <DropdownMenuLabel>{database.attributes.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              if (!canEdit) {
                return;
              }

              setShowUpdateDialog(true);
            }}
            disabled={!canEdit}
          >
            <LetterText className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            disabled={!canEdit}
            onClick={() => {
              if (!canEdit) {
                return;
              }

              setShowUpdateDialog(true);
            }}
          >
            <Image className="size-4" />
            Update icon
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2" disabled>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              if (!canDelete) {
                return;
              }

              setShowDeleteModal(true);
            }}
            disabled={!canDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Created by</DropdownMenuLabel>
          <DropdownMenuItem>
            <EntryCollaboratorAudit
              collaboratorId={database.createdBy}
              date={database.createdAt}
            />
          </DropdownMenuItem>
          {database.updatedBy && database.updatedAt && (
            <React.Fragment>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Last updated by</DropdownMenuLabel>
              <DropdownMenuItem>
                <EntryCollaboratorAudit
                  collaboratorId={database.updatedBy}
                  date={database.updatedAt}
                />
              </DropdownMenuItem>
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DatabaseDeleteDialog
        entryId={database.id}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteModal}
      />
      <DatabaseUpdateDialog
        database={database}
        role={role}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />
    </React.Fragment>
  );
};
