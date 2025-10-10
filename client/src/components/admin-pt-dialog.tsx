import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { PersonalTrainer } from "@shared/schema";

const trainerSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  bio: z.string().optional(),
  specialization: z.string().min(1, "Spesialisasi diperlukan"),
  experience: z.string().optional(),
  certification: z.string().optional(),
  imageUrl: z.string().url("URL gambar tidak valid").optional().or(z.literal("")),
  pricePerSession: z.string().min(1, "Harga per sesi diperlukan"),
});

type TrainerFormData = z.infer<typeof trainerSchema>;

interface AdminPTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainer?: PersonalTrainer | null;
}

export default function AdminPTDialog({ open, onOpenChange, trainer }: AdminPTDialogProps) {
  const { toast } = useToast();
  const isEditing = !!trainer;

  const form = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      name: "",
      bio: "",
      specialization: "",
      experience: "",
      certification: "",
      imageUrl: "",
      pricePerSession: "",
    },
  });

  useEffect(() => {
    if (trainer) {
      form.reset({
        name: trainer.name || "",
        bio: trainer.bio || "",
        specialization: trainer.specialization || "",
        experience: trainer.experience?.toString() || "",
        certification: trainer.certification || "",
        imageUrl: trainer.imageUrl || "",
        pricePerSession: trainer.pricePerSession?.toString() || "",
      });
    } else {
      form.reset({
        name: "",
        bio: "",
        specialization: "",
        experience: "",
        certification: "",
        imageUrl: "",
        pricePerSession: "",
      });
    }
  }, [trainer, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      const payload = {
        ...data,
        experience: data.experience ? parseInt(data.experience) : undefined,
        pricePerSession: parseFloat(data.pricePerSession),
      };
      return await apiRequest("/api/admin/trainers", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trainers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      toast({
        title: "Berhasil!",
        description: "Personal trainer berhasil ditambahkan",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan personal trainer",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      const payload = {
        ...data,
        experience: data.experience ? parseInt(data.experience) : undefined,
        pricePerSession: parseFloat(data.pricePerSession),
      };
      return await apiRequest(`/api/admin/trainers/${trainer?.id}`, "PUT", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trainers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      toast({
        title: "Berhasil!",
        description: "Personal trainer berhasil diupdate",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate personal trainer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TrainerFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Personal Trainer" : "Tambah Personal Trainer"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update informasi personal trainer" : "Isi form di bawah untuk menambah personal trainer baru"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: John Doe" 
                      {...field} 
                      data-testid="input-trainer-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spesialisasi *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: Strength Training, Yoga, Cardio" 
                      {...field} 
                      data-testid="input-trainer-specialization"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ceritakan tentang pengalaman dan keahlian trainer..."
                      rows={4}
                      {...field} 
                      data-testid="input-trainer-bio"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pengalaman (tahun)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5" 
                        {...field} 
                        data-testid="input-trainer-experience"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga per Sesi (USD) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="50.00" 
                        {...field} 
                        data-testid="input-trainer-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sertifikasi</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: NASM CPT, ACE, ISSA" 
                      {...field} 
                      data-testid="input-trainer-certification"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Foto Profil</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/photo.jpg" 
                      {...field} 
                      data-testid="input-trainer-image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-trainer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="gym-gradient text-white"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-trainer"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Tambah Trainer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
