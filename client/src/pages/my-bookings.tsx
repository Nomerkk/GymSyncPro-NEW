import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Dumbbell, Users, X } from "lucide-react";

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

  const { data: classBookings, isLoading: loadingClasses } = useQuery<ClassBookingWithClass[]>({
    queryKey: ["/api/class-bookings"],
    enabled: isAuthenticated,
  });

  const { data: ptBookings, isLoading: loadingPT } = useQuery<PtBookingWithTrainer[]>({
    queryKey: ["/api/pt-bookings"],
    enabled: isAuthenticated,
  });

  const handleCancelClassBooking = async (bookingId: string) => {
    if (!confirm("Yakin ingin membatalkan booking class ini?")) {
      return;
    }

    try {
      await apiRequest("PUT", `/api/class-bookings/${bookingId}/cancel`);
      queryClient.invalidateQueries({ queryKey: ["/api/class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Berhasil!",
        description: "Booking class berhasil dibatalkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membatalkan booking",
        variant: "destructive",
      });
    }
  };

  const handleCancelPTBooking = async (bookingId: string) => {
    if (!confirm("Yakin ingin membatalkan sesi PT ini?")) {
      return;
    }

    try {
      await apiRequest("PUT", `/api/pt-bookings/${bookingId}/cancel`);
      queryClient.invalidateQueries({ queryKey: ["/api/pt-bookings"] });
      toast({
        title: "Berhasil!",
        description: "Sesi PT berhasil dibatalkan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membatalkan sesi PT",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "booked":
      case "confirmed":
        return <Badge variant="default">{status === "booked" ? "Terdaftar" : "Dikonfirmasi"}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case "attended":
      case "completed":
        return <Badge variant="secondary">Selesai</Badge>;
      case "pending":
        return <Badge variant="outline">Menunggu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loadingClasses || loadingPT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Booking Saya</h2>
          <p className="text-muted-foreground mt-1">Lihat dan kelola semua booking Anda</p>
        </div>

        {/* Class Bookings */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-primary" size={20} />
                Gym Class Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!classBookings || classBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto mb-3" size={48} />
                  <p className="text-lg font-medium">Belum Ada Booking Class</p>
                  <p className="text-sm mt-1">Booking class akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`class-booking-${booking.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-lg">
                            {booking.gymClass.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Instruktur: {booking.gymClass.instructorName}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar size={14} />
                              <span>{format(new Date(booking.bookingDate), "dd MMM yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock size={14} />
                              <span>{booking.gymClass.schedule}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(booking.status)}
                          {booking.status === "booked" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClassBooking(booking.id)}
                              data-testid={`button-cancel-class-${booking.id}`}
                            >
                              <X size={16} className="mr-1" />
                              Batal
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PT Bookings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="text-primary" size={20} />
                Personal Trainer Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ptBookings || ptBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Dumbbell className="mx-auto mb-3" size={48} />
                  <p className="text-lg font-medium">Belum Ada Sesi PT</p>
                  <p className="text-sm mt-1">Sesi PT Anda akan muncul di sini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ptBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`pt-booking-${booking.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground text-lg">
                            {booking.trainer.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {booking.trainer.specialization}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar size={14} />
                              <span>
                                {format(new Date(booking.bookingDate), "dd MMM yyyy, HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock size={14} />
                              <span>{booking.duration} menit</span>
                            </div>
                          </div>

                          {booking.notes && (
                            <p className="text-sm text-muted-foreground mt-2 bg-muted/30 rounded p-2">
                              Note: {booking.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(booking.status)}
                          {(booking.status === "pending" || booking.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelPTBooking(booking.id)}
                              data-testid={`button-cancel-pt-${booking.id}`}
                            >
                              <X size={16} className="mr-1" />
                              Batal
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
