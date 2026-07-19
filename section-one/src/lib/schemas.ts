import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const projectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2),
  clientId: z.string(),
  contractValue: z.number().positive(),
  startDate: z.string(),
  endDate: z.string().optional(),
  status: z.enum(["ONGOING", "READY_TO_CLOSE", "CLOSED", "DELAYED"]).default("ONGOING"),
  description: z.string().optional(),
});

export const expenseSchema = z.object({
  projectId: z.string(),
  category: z.enum([
    "MATERIALS",
    "LABOR",
    "SUBCONTRACTOR",
    "EQUIPMENT",
    "ADMINISTRATIVE",
    "OTHER",
  ]),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().optional(),
});

export const partnerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  defaultShare: z.number().min(0).max(100).default(0),
});

export const contributionSchema = z.object({
  partnerId: z.string(),
  amount: z.number().positive(),
  date: z.string().optional(),
  notes: z.string().optional(),
});
