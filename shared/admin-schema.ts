import { z } from "zod";

// Schema for Super Admin to create admin accounts
export const createAdminSchema = z.object({
    username: z.string().min(3, "Username minimal 3 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    firstName: z.string().min(1, "Nama depan wajib diisi"),
    lastName: z.string().min(1, "Nama belakang wajib diisi"),
    homeBranch: z.string().min(1, "Cabang wajib dipilih"),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const updateAdminSchema = createAdminSchema.partial().extend({
    password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
});

export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
