import { useMutation } from "@tanstack/react-query";
import { checkinsService, type CheckinApprovePayload, type MemberQRData, type PreviewCheckInData, type CheckinValidationResult } from "@/services/checkins";
import { queryClient } from "@/lib/queryClient";

export function useAdminCheckinActions() {
  const preview = useMutation<PreviewCheckInData, unknown, string>({
    mutationFn: (qrCode: string) => checkinsService.preview(qrCode),
  });

  const approve = useMutation<CheckinValidationResult, unknown, CheckinApprovePayload>({
    mutationFn: (payload: CheckinApprovePayload) => checkinsService.approve(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/checkins"] });
    },
  });

  const validate = useMutation<CheckinValidationResult, unknown, string>({
    mutationFn: (qrCode: string) => checkinsService.validate(qrCode),
  });

  return { preview, approve, validate };
}

export function useMemberCheckin() {
  const generate = useMutation<MemberQRData, unknown, void>({
    mutationFn: () => checkinsService.generateMember(),
  });
  return { generate };
}
