import { useQuery, useMutation } from "@tanstack/react-query";
import { classBookingsService, type ClassBooking } from "@/services/classBookings";
import { queryClient } from "@/lib/queryClient";

export function useClassBookings(enabled: boolean) {
  return useQuery<ClassBooking[]>({
    queryKey: ["class-bookings"],
    queryFn: classBookingsService.listAdmin,
    enabled,
  });
}

export function useMemberClassBookings(enabled: boolean) {
  return useQuery<ClassBooking[]>({
    queryKey: ["/api/class-bookings"],
    queryFn: classBookingsService.listMine,
    enabled,
  });
}

export function useClassBookingActions() {
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => classBookingsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/class-bookings"] });
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => classBookingsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/class-bookings"] });
    },
  });

  return { updateStatus, cancel };
}

export function useMemberClassBookingActions() {
  const book = useMutation({
    mutationFn: ({ classId, bookingDate }: { classId: string; bookingDate: string }) =>
      classBookingsService.book(classId, bookingDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    },
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => classBookingsService.cancelMember(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    },
  });

  return { book, cancel };
}
