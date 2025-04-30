import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Enter Atleast 3 Characters'),
  email: z.string().email(),
  password: z.string().min(8, 'Minimum 8 Characters Required'),
});
