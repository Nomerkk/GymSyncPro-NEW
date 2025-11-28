import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { feedbacksService } from "@/services/feedbacks";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/types/adminDialogs";
import { useAuth } from "@/hooks/useAuth";

const feedbackSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  isAnonymous: z.boolean().default(false),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      subject: "",
      message: "",
      isAnonymous: false,
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      await feedbacksService.create({
        ...data,
        branch: user?.homeBranch || "Jakarta Barat", // Default fallback
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to Submit",
        description: getErrorMessage(error, "Something went wrong"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    feedbackMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts, suggestions, or report issues
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description"
                      data-testid="input-subject"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us more about your feedback..."
                      className="min-h-[120px]"
                      data-testid="textarea-message"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Kirim sebagai anonim
                    </FormLabel>
                    <FormDescription>
                      Nama dan foto profil Anda tidak akan ditampilkan ke admin.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={feedbackMutation.isPending}
                data-testid="button-submit-feedback"
              >
                {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
