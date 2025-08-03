
import { z } from 'zod';

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  created_at: z.coerce.date()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Input schema for asking questions
export const askQuestionInputSchema = z.object({
  question: z.string().min(1, "Question cannot be empty").max(1000, "Question too long")
});

export type AskQuestionInput = z.infer<typeof askQuestionInputSchema>;

// Response schema for chat answers
export const chatResponseSchema = z.object({
  id: z.number(),
  question: z.string(),
  answer: z.string(),
  created_at: z.coerce.date()
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;
