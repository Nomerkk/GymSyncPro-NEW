import { useQuery, useMutation } from "@tanstack/react-query";
import { trainersService } from "@/services/trainers";
import type { PersonalTrainer } from "@shared/schema.ts";
import { queryClient } from "@/lib/queryClient";

export function useTrainers(enabled: boolean) {
  return useQuery<PersonalTrainer[]>({
    queryKey: ["trainers"],
    queryFn: trainersService.listAdmin,
    enabled,
  });
}

export function useTrainerActions() {
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["trainers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/trainers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
  };

  const create = useMutation({
    mutationFn: trainersService.create,
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof trainersService.update>[1] }) => trainersService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: trainersService.delete,
    onSuccess: invalidateAll,
  });
  return { create, update, remove };
}
