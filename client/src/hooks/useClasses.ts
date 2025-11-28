import { useQuery, useMutation } from "@tanstack/react-query";
import { classesService } from "@/services/classes";
import type { GymClass } from "@shared/schema.ts";
import { queryClient } from "@/lib/queryClient";

export function useClasses(enabled: boolean, branch?: string) {
  return useQuery<GymClass[]>({
    queryKey: ["classes", branch],
    queryFn: () => classesService.listAdmin(branch),
    enabled,
  });
}

export function useClassActions() {
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
  };

  const create = useMutation({
    mutationFn: classesService.create,
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof classesService.update>[1] }) => classesService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: classesService.delete,
    onSuccess: invalidateAll,
  });
  return { create, update, remove };
}
