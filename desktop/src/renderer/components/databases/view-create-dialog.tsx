import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/renderer/contexts/database';
import { FieldSelect } from '@/renderer/components/databases/fields/field-select';
import { toast } from '@/renderer/hooks/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Calendar, Columns, Table } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  type: z.enum(['TABLE', 'BOARD', 'CALENDAR']),
  groupBy: z.string().optional(),
});

interface ViewTypeOption {
  name: string;
  icon: React.FC;
  type: 'TABLE' | 'BOARD' | 'CALENDAR';
}

const viewTypes: ViewTypeOption[] = [
  {
    name: 'Table',
    icon: Table,
    type: 'TABLE',
  },
  {
    name: 'Board',
    icon: Columns,
    type: 'BOARD',
  },
  {
    name: 'Calendar',
    icon: Calendar,
    type: 'CALENDAR',
  },
];

interface ViewCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewCreateDialog = ({
  open,
  onOpenChange,
}: ViewCreateDialogProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'TABLE',
    },
  });
  const type = form.watch('type');

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isPending) {
      return;
    }

    if (values.type === 'TABLE') {
      mutate({
        input: {
          type: 'table_view_create',
          databaseId: database.id,
          name: values.name,
          userId: workspace.userId,
        },
        onSuccess() {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (values.type === 'BOARD') {
      if (!values.groupBy) {
        toast({
          title: 'Failed to create board view',
          description:
            'You need to specify a group by field to create a board view',
          variant: 'destructive',
        });
        return;
      }

      mutate({
        input: {
          type: 'board_view_create',
          databaseId: database.id,
          name: values.name,
          groupBy: values.groupBy,
          userId: workspace.userId,
        },
        onSuccess() {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (values.type === 'CALENDAR') {
      if (!values.groupBy) {
        toast({
          title: 'Failed to create calendar view',
          description:
            'You need to specify a group by field to create a calendar view',
          variant: 'destructive',
        });
        return;
      }

      mutate({
        input: {
          type: 'calendar_view_create',
          databaseId: database.id,
          name: values.name,
          groupBy: values.groupBy,
          userId: workspace.userId,
        },
        onSuccess() {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create view</DialogTitle>
          <DialogDescription>
            Create a new view to display your database records
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex-grow space-y-4 py-2 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-4">
                    {viewTypes.map((viewType) => (
                      <div
                        role="presentation"
                        key={viewType.name}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-md border p-3 text-muted-foreground',
                          'hover:border-gray-500 hover:bg-gray-50',
                          viewType.type === field.value
                            ? 'border-gray-500 text-primary'
                            : '',
                        )}
                        onClick={() => field.onChange(viewType.type)}
                      >
                        <viewType.icon />
                        <p>{viewType.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              />
              {type === 'BOARD' && (
                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group by</FormLabel>
                      <FormControl>
                        <FieldSelect
                          fields={database.fields.filter(
                            (field) => field.dataType === 'select',
                          )}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {type === 'CALENDAR' && (
                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group by</FormLabel>
                      <FormControl>
                        <FieldSelect
                          fields={database.fields.filter(
                            (field) =>
                              field.dataType === 'date' ||
                              field.dataType === 'created_at',
                          )}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
