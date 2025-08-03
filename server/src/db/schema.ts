
import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type ChatMessage = typeof chatMessagesTable.$inferSelect; // For SELECT operations
export type NewChatMessage = typeof chatMessagesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { chatMessages: chatMessagesTable };
