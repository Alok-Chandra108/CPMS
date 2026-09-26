import { z } from 'zod';

export const profileSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be 10 digits')
    .max(10, 'Phone number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  
  dateOfBirth: z.string().optional().or(z.literal('')),
  
  gender: z.enum(['Male', 'Female', 'Other', ''], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  
  address: z.string().min(5, 'Address is too short').max(300, 'Address is too long').optional().or(z.literal('')),
  
  // Academic Details
  tenthPercentage: z
    .union([z.coerce.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'), z.literal('')])
    .optional(),
  
  tenthBoard: z.string().optional().or(z.literal('')),
  
  tenthPassingYear: z
    .union([z.coerce.number().min(2000, 'Year must be 2000 or later').max(new Date().getFullYear(), 'Invalid year'), z.literal('')])
    .optional(),
  
  twelfthPercentage: z
    .union([z.coerce.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'), z.literal('')])
    .optional(),
  
  twelfthBoard: z.string().optional().or(z.literal('')),
  
  twelfthPassingYear: z
    .union([z.coerce.number().min(2000, 'Year must be 2000 or later').max(new Date().getFullYear(), 'Invalid year'), z.literal('')])
    .optional(),
  
  cgpa: z
    .union([z.coerce.number().min(0, 'CGPA cannot be negative').max(10, 'CGPA cannot exceed 10'), z.literal('')])
    .optional(),
  
  backlogs: z.coerce
    .number()
    .min(0, 'Backlogs cannot be negative')
    .default(0),
  
  // Skills & Social
  skills: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return val || [];
    },
    z.array(z.string()).optional()
  ),
  projects: z.array(z.object({
    title: z.string().min(1, 'Project title is required').max(100, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
    techStack: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          return val.split(',').map(s => s.trim()).filter(Boolean);
        }
        return val || [];
      },
      z.array(z.string()).optional()
    ),
    link: z.string().url('Invalid Project URL').optional().or(z.literal('')),
  })).max(5, 'Maximum 5 projects allowed').optional(),
  
  linkedIn: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  
  github: z
    .string()
    .url('Invalid GitHub URL')
    .optional()
    .or(z.literal('')),
});
