
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { askQuestionInputSchema } from './schema';
import { askQuestion } from './handlers/ask_question';
import { getRecentMessages } from './handlers/get_recent_messages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Ask a question to the AI chatbot
  askQuestion: publicProcedure
    .input(askQuestionInputSchema)
    .mutation(({ input }) => askQuestion(input)),
  
  // Get recent chat messages
  getRecentMessages: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).default(10) }).optional())
    .query(({ input }) => getRecentMessages(input?.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`AI Chatbot TRPC server listening at port: ${port}`);
}

start();
