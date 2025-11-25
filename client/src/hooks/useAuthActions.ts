import { useMutation } from "@tanstack/react-query";
import { authService, type LoginPayload, type RegisterPayload } from "@/services/auth";
import { queryClient } from "@/lib/queryClient";

function invalidateUser() {
  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
}

export function useAuthActions() {
  const login = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: invalidateUser,
  });

  const loginAdmin = useMutation({
    mutationFn: (payload: LoginPayload) => authService.loginAdmin(payload),
    onSuccess: invalidateUser,
  });

  const logout = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: invalidateUser,
  });

  const registerVerified = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.registerVerified(payload),
    onSuccess: invalidateUser,
  });

  const registerAdmin = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.registerAdmin(payload),
    onSuccess: invalidateUser,
  });

  const sendVerificationCode = useMutation({
    mutationFn: (email: string) => authService.sendVerificationCode(email),
  });

  const resendVerificationCode = useMutation({
    mutationFn: (email: string) => authService.resendVerificationCode(email),
  });

  const checkVerificationCode = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => authService.checkVerificationCode(email, code),
  });

  const verifyEmail = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => authService.verifyEmail({ email, code }),
    onSuccess: invalidateUser,
  });

  const forgotPassword = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });

  const resetPassword = useMutation({
    mutationFn: (payload: { email?: string; password?: string; token?: string }) => authService.resetPassword(payload),
  });

  return {
    login,
    loginAdmin,
    logout,
    registerVerified,
    registerAdmin,
    sendVerificationCode,
    resendVerificationCode,
    checkVerificationCode,
    verifyEmail,
    forgotPassword,
    resetPassword,
  };
}
