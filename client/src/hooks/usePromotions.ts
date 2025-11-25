import { useQuery, useMutation } from "@tanstack/react-query";
import { promotionsService, type Promotion } from "@/services/promotions";
import { queryClient } from "@/lib/queryClient";

export function usePromotions(enabled: boolean) {
  return useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: promotionsService.listAdmin,
    enabled,
  });
}

export function usePromotionActions() {
  const create = useMutation({
    mutationFn: (payload: Partial<Promotion>) => promotionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member/promotions"] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Promotion> }) => promotionsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member/promotions"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => promotionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member/promotions"] });
    },
  });
  const uploadImage = useMutation({
    mutationFn: (dataUrl: string) => promotionsService.uploadImage(dataUrl),
  });
  return { create, update, remove, uploadImage };
}
