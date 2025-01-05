import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoginOutput } from '@colanode/core';
import { useEffect, useState } from 'react';

import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/renderer/components/ui/form';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { Server } from '@/shared/types/servers';

const formSchema = z.object({
  otp: z.string().min(2),
});

interface EmailVerifyProps {
  server: Server;
  id: string;
  expiresAt: Date;
  onSuccess: (output: LoginOutput) => void;
}

export const EmailVerify = ({
  server,
  id,
  expiresAt,
  onSuccess,
}: EmailVerifyProps) => {
  const { mutate, isPending } = useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
    },
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    const initialSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000)
    );
    setRemainingSeconds(initialSeconds);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return 'This code has expired';
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return `This code expires in ${minutes}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (remainingSeconds <= 0) {
      toast({
        title: 'Code has expired',
        description: 'Please request a new code',
        variant: 'destructive',
      });
      return;
    }

    mutate({
      input: {
        type: 'email_verify',
        otp: values.otp,
        server: server.domain,
        id,
      },
      onSuccess(output) {
        onSuccess(output);
      },
      onError(error) {
        toast({
          title: 'Failed to login',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <p className="text-sm text-muted-foreground w-full text-center">
                Write the code you received in your email
              </p>
              <FormControl>
                <Input placeholder="Code" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground w-full text-center">
                {formatTime(remainingSeconds)}
              </p>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={isPending || remainingSeconds <= 0}
        >
          {isPending ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Mail className="mr-2 size-4" />
          )}
          Confirm
        </Button>
      </form>
    </Form>
  );
};
