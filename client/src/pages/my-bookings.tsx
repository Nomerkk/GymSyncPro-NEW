import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Dumbbell, X, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClassBookingWithClass {
  id: string;
  userId: string;
  classId: string;
  bookingDate: string;
  status: string;
  createdAt: string;
  gymClass: {
    id: string;
    name: string;
    description?: string;
    instructorName: string;
    schedule: string;
    maxCapacity: number;
    currentEnrollment: number;
  };
}

interface PtBookingWithTrainer {
  id: string;
  userId: string;
  trainerId: string;
  bookingDate: string;
  duration: number;
  status: string;
  notes?: string;
  createdAt: string;
  trainer: {
    id: string;
    name: string;
    specialization: string;
    pricePerSession: string;
  };
}

export default function MyBookings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("classes");

  const { data: classBookings, isLoading: loadingClasses } = useQuery<ClassBookingWithClass[]>({
    queryKey: ["/api/class-bookings"],
    enabled: isAuthenticated,
  });

  const { data: ptBookings, isLoading: loadingPT } = useQuery<PtBookingWithTrainer[]>({
    queryKey: ["/api/pt-bookings"],
    enabled: isAuthenticated,
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const notificationCount = notifications?.filter(n => !n.isRead).length || 0;

  const cancelClassMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiRequest("PUT", `/api/class-bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Success", description: "Class booking cancelled" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  const cancelPTMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiRequest("PUT", `/api/pt-bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pt-bookings"] });
      toast({ title: "Success", description: "PT session cancelled" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel PT session",
        variant: "destructive",
      });
    },
  });

  const handleCancelClass = (bookingId: string) => {
    if (confirm("Cancel this class booking?")) {
      cancelClassMutation.mutate(bookingId);
    }
  };

  const handleCancelPT = (bookingId: string) => {
    if (confirm("Cancel this PT session?")) {
      cancelPTMutation.mutate(bookingId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "secondary" | "outline", label: string, color: string }> = {
      booked: { variant: "default", label: "Booked", color: "bg-neon-green/10 text-neon-green border-neon-green/20" },
      confirmed: { variant: "default", label: "Confirmed", color: "bg-neon-green/10 text-neon-green border-neon-green/20" },
      cancelled: { variant: "destructive", label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20" },
      attended: { variant: "secondary", label: "Attended", color: "bg-muted text-muted-foreground border-border" },
      completed: { variant: "secondary", label: "Completed", color: "bg-muted text-muted-foreground border-border" },
      pending: { variant: "outline", label: "Pending", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20" },
    };

    const config = variants[status] || { variant: "outline" as const, label: status, color: "" };
    return (
      <Badge variant={config.variant} className={cn("text-xs font-semibold border", config.color)}>
        {config.label}
      </Badge>
    );
  };

  if (loadingClasses || loadingPT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const activeClasses = classBookings?.filter(b => b.status === 'booked' || b.status === 'confirmed') || [];
  const activePT = ptBookings?.filter(b => b.status === 'booked' || b.status === 'confirmed') || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-neon-purple/5 to-background border-b border-border/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">My Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {activeClasses.length + activePT.length} active bookings
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger 
              value="classes" 
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold"
              data-testid="tab-classes"
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              Classes ({classBookings?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="pt" 
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold"
              data-testid="tab-pt"
            >
              <User className="h-4 w-4 mr-2" />
              PT Sessions ({ptBookings?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Class Bookings */}
          <TabsContent value="classes" className="space-y-3 mt-0">
            {!classBookings || classBookings.length === 0 ? (
              <Card className="p-8 text-center border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Dumbbell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">No Class Bookings</p>
                    <p className="text-sm text-muted-foreground">
                      Book your first class to get started!
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              classBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className={cn(
                    "p-5 border-border/50 backdrop-blur-sm transition-all hover:shadow-md",
                    booking.status === 'cancelled' ? "bg-muted/20 opacity-60" : "bg-card/50"
                  )}
                  data-testid={`booking-class-${booking.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-neon-purple/10 rounded-xl">
                          <Dumbbell className="h-4 w-4 text-neon-purple" />
                        </div>
                        <h3 className="font-bold text-foreground">{booking.gymClass.name}</h3>
                      </div>
                      
                      <div className="space-y-2 ml-10">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>{booking.gymClass.instructorName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(booking.bookingDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{booking.gymClass.schedule}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        {getStatusBadge(booking.status)}
                        {booking.status === 'booked' || booking.status === 'confirmed' ? (
                          <button
                            onClick={() => handleCancelClass(booking.id)}
                            disabled={cancelClassMutation.isPending}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                            data-testid={`button-cancel-class-${booking.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* PT Bookings */}
          <TabsContent value="pt" className="space-y-3 mt-0">
            {!ptBookings || ptBookings.length === 0 ? (
              <Card className="p-8 text-center border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">No PT Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Book a personal trainer session today!
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              ptBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className={cn(
                    "p-5 border-border/50 backdrop-blur-sm transition-all hover:shadow-md",
                    booking.status === 'cancelled' ? "bg-muted/20 opacity-60" : "bg-card/50"
                  )}
                  data-testid={`booking-pt-${booking.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-neon-green/10 rounded-xl">
                          <User className="h-4 w-4 text-neon-green" />
                        </div>
                        <h3 className="font-bold text-foreground">{booking.trainer.name}</h3>
                      </div>
                      
                      <div className="space-y-2 ml-10">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Dumbbell className="h-3.5 w-3.5" />
                          <span>{booking.trainer.specialization}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(booking.bookingDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{booking.duration} minutes</span>
                        </div>
                        {booking.notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{booking.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        {getStatusBadge(booking.status)}
                        {booking.status === 'booked' || booking.status === 'confirmed' ? (
                          <button
                            onClick={() => handleCancelPT(booking.id)}
                            disabled={cancelPTMutation.isPending}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                            data-testid={`button-cancel-pt-${booking.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation notificationCount={notificationCount} />
    </div>
  );
}
