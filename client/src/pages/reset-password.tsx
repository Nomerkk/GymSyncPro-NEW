import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// apiRequest deprecated: using hook-based auth actions instead
import { resetPasswordSchema, type ResetPasswordInput } from "@shared/schema.ts";
import { Dumbbell } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { useAuthActions } from "@/hooks/useAuthActions";
import { getErrorMessage } from "@/types/adminDialogs";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(searchParams);
  const tokenFromUrl = urlParams.get('token') || '';

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      form.setValue('token', tokenFromUrl);
    }
  }, [tokenFromUrl, form]);

  const { resetPassword } = useAuthActions();
  const resetPasswordMutation = resetPassword;

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Password Berhasil Direset",
          description: "Silakan login dengan password baru Anda",
        });
        setLocation("/login");
      },
      onError: (error: unknown) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: getErrorMessage(error, "Gagal mereset password"),
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200/30 dark:bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300/20 dark:bg-yellow-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-100/20 dark:bg-yellow-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-yellow-200 dark:border-yellow-900/30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Masukkan kode verifikasi dan password baru Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Kode Verifikasi</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan 6 digit kode"
                        data-testid="input-verification-code"
                        className="border-gray-300 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-500 text-center text-2xl tracking-widest font-semibold"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Password Baru</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimal 6 karakter"
                        data-testid="input-new-password"
                        className="border-gray-300 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Konfirmasi Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ulangi password baru"
                        data-testid="input-confirm-password"
                        className="border-gray-300 dark:border-gray-600 focus:border-yellow-500 dark:focus:border-yellow-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
                disabled={resetPasswordMutation.isPending}
                data-testid="button-reset-password"
              >
                {resetPasswordMutation.isPending ? "Mereset..." : "Reset Password"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400"
                data-testid="link-back-to-login"
              >
                Kembali ke Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
