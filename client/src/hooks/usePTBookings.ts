import { useQuery, useMutation } from "@tanstack/react-query";
import { ptBookingsService, type PTBooking } from "@/services/ptBookings";
import { queryClient } from "@/lib/queryClient";

export function usePTBookings(enabled: boolean) {
  return useQuery<PTBooking[]>({
    queryKey: ["pt-bookings"],
    queryFn: ptBookingsService.listAdmin,
    enabled,
  });
}

export function useMemberPTBookings(enabled: boolean) {
  return useQuery<PTBooking[]>({
    queryKey: ["/api/pt-bookings"],
    queryFn: ptBookingsService.listMine,
    enabled,
  });
}

export function usePTBookingActions() {
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ptBookingsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pt-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pt-bookings"] });
    },
  });
  return { updateStatus };
}

export function useMemberPTBookingActions() {
  const create = useMutation({
    mutationFn: (payload: { trainerId: string; bookingDate: string; sessionCount: number; notes?: string }) =>
      ptBookingsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pt-bookings"] });
    },
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => ptBookingsService.cancel(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pt-bookings"] });
    },
  });

  return { create, cancel };
}
