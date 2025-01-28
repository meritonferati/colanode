import { BadgeAlert } from 'lucide-react';

export const SpaceNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <BadgeAlert className="size-12 mb-4" />
      <h1 className="text-2xl font-semibold tracking-tight">Space not found</h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        The space you are looking for does not exist. It may have been deleted
        or your access has been removed.
      </p>
    </div>
  );
};
