import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbacksService } from "@/services/feedbacks";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, Link } from "wouter";
import { ChevronLeft, Send, Loader2, User, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MemberFeedbackDetail() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, params] = useRoute("/feedback/:id");
    const id = params?.id;
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: feedback, isLoading: feedbackLoading } = useQuery({
        queryKey: ["/api/feedbacks", id],
        queryFn: () => feedbacksService.getById(id!),
        enabled: !!id,
    });

    const { data: replies, isLoading: repliesLoading } = useQuery({
        queryKey: ["/api/feedbacks", id, "replies"],
        queryFn: () => feedbacksService.getReplies(id!),
        enabled: !!id,
    });

    const replyMutation = useMutation({
        mutationFn: (msg: string) => feedbacksService.createReply(id!, msg),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/feedbacks", id, "replies"] });
            queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] }); // Update list view last activity
            setMessage("");
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
        },
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        replyMutation.mutate(message);
    };

    // Auto-scroll to bottom when replies change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [replies]);

    if (feedbackLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <p className="text-lg font-semibold mb-2">Ticket not found</p>
                <Link href="/feedback">
                    <Button variant="outline">Go Back</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
                <Link href="/feedback">
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="font-semibold text-foreground truncate">{feedback.subject}</h1>
                    <p className="text-xs text-muted-foreground">
                        {feedback.status === 'resolved' ? 'Resolved' : 'Open'} • {format(new Date(feedback.createdAt), "MMM dd, HH:mm")}
                    </p>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {/* Original Message */}
                <div className="flex gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm font-medium text-foreground">You</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(feedback.createdAt), "HH:mm")}</span>
                        </div>
                        <div className="bg-primary/10 text-foreground p-3 rounded-2xl rounded-tl-none text-sm">
                            {feedback.message}
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {replies?.map((reply: any) => {
                    const isMe = reply.senderId === user?.id;
                    const isAdmin = reply.sender?.role === 'admin' || reply.sender?.role === 'super_admin';

                    return (
                        <div key={reply.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "")}>
                            <Avatar className="h-8 w-8 border border-border">
                                <AvatarFallback className={cn("text-xs", isAdmin ? "bg-neon-purple/10 text-neon-purple" : "bg-primary/10 text-primary")}>
                                    {isAdmin ? <ShieldCheck className="h-4 w-4" /> : "ME"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn("flex-1 space-y-1 max-w-[85%]", isMe ? "items-end flex flex-col" : "")}>
                                <div className={cn("flex items-baseline gap-2", isMe ? "flex-row-reverse" : "")}>
                                    <span className="text-sm font-medium text-foreground">{isMe ? "You" : (isAdmin ? "Support Team" : reply.sender?.name)}</span>
                                    <span className="text-[10px] text-muted-foreground">{format(new Date(reply.createdAt), "HH:mm")}</span>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm",
                                    isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                                )}>
                                    {reply.message}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {feedback.status === 'resolved' && (
                    <div className="flex justify-center py-4">
                        <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                            This ticket has been marked as resolved
                        </span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            {feedback.status !== 'resolved' && (
                <div className="p-4 border-t border-border bg-background/80 backdrop-blur-md sticky bottom-0">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your reply..."
                            className="flex-1"
                            disabled={replyMutation.isPending}
                        />
                        <Button type="submit" size="icon" disabled={!message.trim() || replyMutation.isPending}>
                            {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
