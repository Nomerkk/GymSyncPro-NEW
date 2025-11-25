import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { uploadsService } from "@/services/uploads";
import { useTrainerActions } from "@/hooks/useTrainers";
import { Loader2 } from "lucide-react";
import type { PersonalTrainer } from "@shared/schema.ts";
import { getErrorMessage } from "@/types/adminDialogs";

const trainerSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  bio: z.string().optional(),
  specialization: z.string().min(1, "Spesialisasi diperlukan"),
  experience: z.string().optional(),
  certification: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  pricePerSession: z.string().min(1, "Harga per sesi diperlukan"),
});

type TrainerFormData = z.infer<typeof trainerSchema>; // Type definition remains unchanged

interface AdminPTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainer?: PersonalTrainer | null;
}

export default function AdminPTDialog({ open, onOpenChange, trainer }: AdminPTDialogProps) {
  const { toast } = useToast();
  const isEditing = !!trainer;
    const { create, update } = useTrainerActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(undefined);

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

  // Mutations moved to hook, with shared invalidation

  const onSubmit = (data: TrainerFormData) => {
    const payload = {
      ...data,
      experience: data.experience ? parseInt(data.experience) : undefined,
      pricePerSession: parseFloat(data.pricePerSession),
      imageUrl: data.imageUrl || undefined,
    };
    if (isEditing && trainer?.id) {
      update.mutate({ id: trainer.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Berhasil!", description: "Personal trainer berhasil diupdate" });
          onOpenChange(false);
        },
        onError: (error) => toast({ title: "Error", description: getErrorMessage(error, "Gagal mengupdate personal trainer"), variant: "destructive" }),
      });
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Berhasil!", description: "Personal trainer berhasil ditambahkan" });
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => toast({ title: "Error", description: getErrorMessage(error, "Gagal menambahkan personal trainer"), variant: "destructive" }),
      });
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Format tidak didukung', description: 'Pilih file gambar (PNG/JPG/WEBP).', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      try {
        setUploading(true);
        const { url } = await uploadsService.uploadImage(dataUrl);
        form.setValue('imageUrl', url, { shouldDirty: true });
        toast({ title: 'Foto terunggah', description: 'Foto profil berhasil diunggah.' });
      } catch (err) {
        toast({ title: 'Gagal unggah', description: getErrorMessage(err, 'Tidak bisa mengunggah foto'), variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
            {/* Foto profil uploader */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Foto Profil</span>
                  <span className="text-xs text-muted-foreground">Upload foto profil trainer</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handlePickFile} disabled={uploading}>
                  {uploading ? 'Mengunggah…' : 'Pilih Foto'}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
              {(preview || form.watch('imageUrl')) && (
                <div className="aspect-[1/1] w-40 overflow-hidden rounded-md border border-border">
                  <img src={preview || form.watch('imageUrl')!} alt="Foto Profil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              )}
            </div>
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

            {/* URL field removed in favor of uploader */}

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
                disabled={create.isPending || update.isPending}
                data-testid="button-submit-trainer"
              >
                {(create.isPending || update.isPending) && (
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
