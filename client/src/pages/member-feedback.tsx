import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbacksService, type Feedback } from "@/services/feedbacks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Plus, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";

const createFeedbackSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    branch: z.string().min(1, "Branch is required"),
    isAnonymous: z.boolean().default(false),
});

export default function MemberFeedback() {
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [, setLocation] = useLocation();

    const { data: feedbacks, isLoading } = useQuery({
        queryKey: ["/api/feedbacks"],
        queryFn: feedbacksService.getAll,
        enabled: isAuthenticated,
    });

    const form = useForm<z.infer<typeof createFeedbackSchema>>({
        resolver: zodResolver(createFeedbackSchema),
        defaultValues: {
            subject: "",
            message: "",
            branch: "",
            isAnonymous: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: feedbacksService.create,
        onMutate: async (newFeedbackData) => {
            // 1. Close dialog immediately
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Success", description: "Feedback ticket created" });

            // 2. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["/api/feedbacks"] });

            // 3. Snapshot the previous value
            const previousFeedbacks = queryClient.getQueryData<Feedback[]>(["/api/feedbacks"]);

            // 4. Optimistic update
            const optimisticFeedback: Feedback = {
                id: Math.random().toString(), // Temp ID
                subject: newFeedbackData.subject,
                message: newFeedbackData.message,
                branch: newFeedbackData.branch,
                status: 'open',
                isResolved: false,
                createdAt: new Date().toISOString(),
                lastReplyAt: new Date().toISOString(),
                userId: "", // Will be filled by backend, irrelevant for list view usually
            };

            queryClient.setQueryData(["/api/feedbacks"], (old: Feedback[] | undefined) => {
                return old ? [optimisticFeedback, ...old] : [optimisticFeedback];
            });

            // Return a context object with the snapshotted value
            return { previousFeedbacks };
        },
        onError: (err, newFeedback, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            queryClient.setQueryData(["/api/feedbacks"], context?.previousFeedbacks);
            toast({ title: "Error", description: "Failed to create feedback", variant: "destructive" });
        },
        onSettled: () => {
            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
        },
    });

    const onSubmit = (values: z.infer<typeof createFeedbackSchema>) => {
        createMutation.mutate(values);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="bg-gradient-to-br from-primary/15 via-neon-purple/10 to-background border-b border-border sticky top-0 z-10 backdrop-blur-xl shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Contact support or send feedback</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full gap-2 bg-gradient-to-r from-primary to-neon-purple text-white shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            Create New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                            <DialogDescription>
                                Fill out the form below to submit a new support ticket.
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
                                                <Input placeholder="Brief summary of your issue" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="branch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Branch</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a branch" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                                                    <SelectItem value="Cikarang">Cikarang</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                                <Textarea placeholder="Describe your issue or feedback in detail..." className="min-h-[100px]" {...field} />
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
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Submit Anonymously
                                                </FormLabel>
                                                <DialogDescription>
                                                    Your name will be hidden from admins.
                                                </DialogDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Submit Ticket
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !feedbacks ? (
                    <Card className="p-8 text-center border-border bg-card shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            <p className="font-semibold text-red-500">Failed to load tickets</p>
                            <p className="text-sm text-muted-foreground">Please try again later</p>
                        </div>
                    </Card>
                ) : feedbacks.length === 0 ? (
                    <Card className="p-8 text-center border-border bg-card shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            <p className="font-semibold">No tickets yet</p>
                            <p className="text-sm text-muted-foreground">Create a ticket to get help</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {feedbacks.map((feedback: Feedback) => (
                            <Card
                                key={feedback.id}
                                className="p-4 border-border bg-card shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                                onClick={() => setLocation(`/feedback/${feedback.id}`)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-foreground line-clamp-1">{feedback.subject}</h3>
                                            <Badge variant={feedback.status === 'resolved' ? 'secondary' : 'default'} className="text-[10px] px-1.5 h-5">
                                                {feedback.status === 'resolved' ? 'Resolved' : 'Open'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{feedback.message}</p>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {feedback.lastReplyAt ? `Last activity: ${format(new Date(feedback.lastReplyAt), "MMM dd, HH:mm")}` : `Created: ${format(new Date(feedback.createdAt), "MMM dd, HH:mm")}`}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground mt-2" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <BottomNavigation />
        </div>
    );
}
