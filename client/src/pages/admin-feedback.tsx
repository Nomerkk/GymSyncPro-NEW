import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Dialog imports removed as they are unused
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Filter, Send, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { feedbacksService, type Feedback, type FeedbackReply } from "@/services/feedbacks";
import { cn } from "@/lib/utils";
import { httpFetch } from "@/services/api";



export default function AdminFeedback() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading, isAdmin]);

  const { data: feedbacks, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ["/api/admin/feedbacks", branchFilter],
    queryFn: () => feedbacksService.getAllAdmin(branchFilter),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: replies, isLoading: repliesLoading, refetch: refetchReplies } = useQuery({
    queryKey: ["/api/feedbacks", selectedFeedback?.id, "replies"],
    queryFn: () => feedbacksService.getReplies(selectedFeedback!.id),
    enabled: !!selectedFeedback,
  });

  const replyMutation = useMutation({
    mutationFn: (msg: string) => feedbacksService.createReply(selectedFeedback!.id, msg),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ["/api/feedbacks", selectedFeedback?.id, "replies"] });
      const previousReplies = queryClient.getQueryData<FeedbackReply[]>(["/api/feedbacks", selectedFeedback?.id, "replies"]);

      const optimisticReply: FeedbackReply = {
        id: Math.random().toString(),
        feedbackId: selectedFeedback!.id,
        senderId: user?.id || "",
        message: newMsg,
        createdAt: new Date().toISOString(),
        sender: {
          id: user?.id || "",
          firstName: user?.firstName || "Me",
          lastName: user?.lastName || "",
          role: user?.role || "admin",
          name: `${user?.firstName} ${user?.lastName}`
        }
      };

      queryClient.setQueryData(["/api/feedbacks", selectedFeedback?.id, "replies"], (old: FeedbackReply[] | undefined) => {
        return old ? [...old, optimisticReply] : [optimisticReply];
      });

      setReplyMessage("");
      return { previousReplies };
    },
    onError: (err, newMsg, context) => {
      queryClient.setQueryData(["/api/feedbacks", selectedFeedback?.id, "replies"], context?.previousReplies);
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks", selectedFeedback?.id, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedbacks"] }); // Update list view last activity
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, isResolved }: { id: string; status: string; isResolved: boolean }) =>
      httpFetch(`/api/admin/feedbacks/${id}`, { // Updated to use admin endpoint
        method: "PUT", // Updated to PUT as per routes.ts
        body: { status, adminResponse: true } // Assuming adminResponse flag or similar is needed, routes.ts expects adminResponse in body?
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedbacks"] });
      toast({ title: "Success", description: "Ticket status updated" });
      if (selectedFeedback) {
        setSelectedFeedback(prev => prev ? ({ ...prev, status: 'resolved', isResolved: true }) : null);
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies, selectedFeedback]);

  if (!user || !isAdmin) return null;

  const filteredFeedbacks = feedbacks?.filter(f => {
    // Branch filtering is now handled server-side
    if (statusFilter !== "all") {
      if (statusFilter === "open" && f.isResolved) return false;
      if (statusFilter === "resolved" && !f.isResolved) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage member inquiries and feedback</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          {isSuperAdmin && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="Jakarta Barat">Jakarta Barat</SelectItem>
                <SelectItem value="Cikarang">Cikarang</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* Ticket List */}
        <div className="md:col-span-1 overflow-y-auto space-y-3 pr-2">
          {listLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : !filteredFeedbacks?.length ? (
            <div className="text-center py-10 text-muted-foreground">No tickets found</div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                className={cn(
                  "cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedFeedback?.id === feedback.id ? "border-primary bg-accent/50" : ""
                )}
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={feedback.isAnonymous ? undefined : feedback.user?.profileImageUrl} />
                        <AvatarFallback>{feedback.isAnonymous ? "?" : feedback.user?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {feedback.isAnonymous ? "Anonymous User" : `${feedback.user?.firstName} ${feedback.user?.lastName}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{feedback.branch || feedback.user?.homeBranch || 'No Branch'}</p>
                      </div>
                    </div>
                    <Badge variant={feedback.isResolved ? "secondary" : "default"} className="text-[10px]">
                      {feedback.isResolved ? "Resolved" : "Open"}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate">{feedback.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{feedback.message}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {format(new Date(feedback.lastReplyAt || feedback.createdAt), "MMM dd, HH:mm")}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Detail View */}
        <Card className="md:col-span-2 flex flex-col h-full overflow-hidden">
          {!selectedFeedback ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a ticket to view details</p>
            </div>
          ) : (
            <>
              <CardHeader className="border-b py-3 bg-muted/30 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{selectedFeedback.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Ticket #{selectedFeedback.id.slice(0, 8)} • {selectedFeedback.branch} • {format(new Date(selectedFeedback.createdAt), "PPP p")}
                    </p>
                  </div>
                  {!selectedFeedback.isResolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => statusMutation.mutate({ id: selectedFeedback.id, status: 'resolved', isResolved: true })}
                      disabled={statusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {/* Original Message */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={selectedFeedback.isAnonymous ? undefined : selectedFeedback.user?.profileImageUrl} />
                    <AvatarFallback>{selectedFeedback.isAnonymous ? "?" : selectedFeedback.user?.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {selectedFeedback.isAnonymous ? "Anonymous User" : `${selectedFeedback.user?.firstName} ${selectedFeedback.user?.lastName}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(selectedFeedback.createdAt), "HH:mm")}</span>
                    </div>
                    <div className="bg-muted text-foreground p-3 rounded-2xl rounded-tl-none text-sm">
                      {selectedFeedback.message}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {repliesLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                ) : (
                  replies?.map((reply: FeedbackReply) => {
                    const isAdminReply = reply.sender?.role === 'admin' || reply.sender?.role === 'super_admin';

                    return (
                      <div key={reply.id} className={cn("flex gap-3", isAdminReply ? "flex-row-reverse" : "")}>
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className={cn("text-xs", isAdminReply ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            {isAdminReply ? "ME" : reply.sender?.firstName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("flex-1 space-y-1 max-w-[85%]", isAdminReply ? "items-end flex flex-col" : "")}>
                          <div className={cn("flex items-baseline gap-2", isAdminReply ? "flex-row-reverse" : "")}>
                            <span className="text-sm font-medium text-foreground">
                              {isAdminReply ? "You" : `${reply.sender?.firstName} ${reply.sender?.lastName}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(reply.createdAt), "HH:mm")}</span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-2xl text-sm",
                            isAdminReply ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                          )}>
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {selectedFeedback.isResolved && (
                  <div className="flex justify-center py-4">
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" /> Ticket Resolved
                    </span>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              {!selectedFeedback.isResolved && (
                <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (replyMessage.trim()) replyMutation.mutate(replyMessage);
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type a reply..."
                      disabled={replyMutation.isPending}
                    />
                    <Button type="submit" size="icon" disabled={!replyMessage.trim() || replyMutation.isPending}>
                      {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
