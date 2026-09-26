import { z } from 'zod';
import { DEPARTMENTS, YEARS_OF_STUDY } from '../constants/roles';

const collegeDomain = import.meta.env.VITE_COLLEGE_DOMAIN || 'mite.ac.in';
const emailDomainRegex = new RegExp(`@${collegeDomain.replace('.', '\\.')}$`);

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Full name cannot exceed 60 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email')
      .regex(emailDomainRegex, `Must use your @${collegeDomain} college email`),
    usnNumber: z
      .string()
      .min(6, 'USN Number must be at least 6 characters')
      .max(20, 'USN Number cannot exceed 20 characters')
      .regex(/^[a-zA-Z0-9]+$/, 'USN Number must be alphanumeric'),
    department: z
      .string()
      .min(1, 'Please select a department')
      .refine((val) => DEPARTMENTS.includes(val), 'Please select a valid department'),
    yearOfStudy: z
      .string()
      .min(1, 'Please select year of study')
      .refine((val) => YEARS_OF_STUDY.includes(val), 'Please select a valid year'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email')
    .regex(emailDomainRegex, `Must use your @${collegeDomain} college email`),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email')
    .regex(emailDomainRegex, `Must use your @${collegeDomain} college email`),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});
