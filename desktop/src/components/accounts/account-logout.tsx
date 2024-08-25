import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface AccountLogoutProps {
  id: string;
  onCancel: () => void;
}

export const AccountLogout = ({ id, onCancel }: AccountLogoutProps) => {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  return (
    <AlertDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want logout?</AlertDialogTitle>
          <AlertDialogDescription>
            All your data will be removed from this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isLoggingOut}
            onClick={async () => {
              setIsLoggingOut(true);
              await window.neuron.logout(id);
              window.location.href = '/';
            }}
          >
            {isLoggingOut && <Spinner className="mr-1" />}
            Logout
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
