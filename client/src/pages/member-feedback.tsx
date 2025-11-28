import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbacksService } from "@/services/feedbacks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
        },
    });

    const createMutation = useMutation({
        mutationFn: feedbacksService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
            toast({ title: "Success", description: "Feedback ticket created" });
            setIsDialogOpen(false);
            form.reset();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create feedback", variant: "destructive" });
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
                ) : !feedbacks || feedbacks.length === 0 ? (
                    <Card className="p-8 text-center border-border bg-card shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            <p className="font-semibold">No tickets yet</p>
                            <p className="text-sm text-muted-foreground">Create a ticket to get help</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {feedbacks.map((feedback: any) => (
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
