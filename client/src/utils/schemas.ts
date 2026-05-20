import { z } from 'zod';

const nameRegex = /^[\p{L}\s'\-]+$/u;

export const orderSchema = z.object({
  nama_pengirim: z
    .string()
    .min(2, 'Nama terlalu pendek')
    .max(100, 'Nama terlalu panjang')
    .regex(nameRegex, 'Nama hanya boleh huruf dan spasi'),
  nama_penerima: z
    .string()
    .min(2, 'Nama terlalu pendek')
    .max(100, 'Nama terlalu panjang')
    .regex(nameRegex, 'Nama hanya boleh huruf dan spasi'),
  pesan: z
    .string()
    .min(10, 'Pesan terlalu pendek')
    .max(2000, 'Pesan maksimal 2000 karakter')
    .transform((val) => val.replace(/<[^>]*>/g, '').trim()),
  nominal: z
    .number()
    .int()
    .refine((val) => val > 0, 'Nominal tidak valid'),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid')
    .optional(),
  highlight_title_1: z.string().max(80).optional(),
  highlight_desc_1: z.string().max(500).optional(),
  highlight_title_2: z.string().max(80).optional(),
  highlight_desc_2: z.string().max(500).optional(),
  captions: z.array(z.string().max(200)).max(11).optional(),
  footer_message: z.string().max(300).optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nama terlalu pendek')
    .max(100, 'Nama terlalu panjang')
    .regex(nameRegex, 'Nama hanya boleh huruf dan spasi'),
  email: z.string().email('Email tidak valid').max(200),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password terlalu panjang'),
});

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid').max(200),
  password: z.string().min(1, 'Password wajib diisi').max(128),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Email tidak valid').max(200),
  password: z.string().min(1, 'Password wajib diisi').max(128),
});
