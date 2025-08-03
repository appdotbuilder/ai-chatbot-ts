
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type AskQuestionInput } from '../schema';
import { askQuestion } from '../handlers/ask_question';
import { eq } from 'drizzle-orm';

// Test input
const testInput: AskQuestionInput = {
  question: 'What is the meaning of life?'
};

describe('askQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chat message with AI response', async () => {
    const result = await askQuestion(testInput);

    // Basic field validation
    expect(result.question).toEqual('What is the meaning of life?');
    expect(result.answer).toContain('I received your question');
    expect(result.answer).toContain(testInput.question);
    expect(result.answer).toContain('placeholder response');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chat message to database', async () => {
    const result = await askQuestion(testInput);

    // Query using proper drizzle syntax
    const chatMessages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(chatMessages).toHaveLength(1);
    expect(chatMessages[0].question).toEqual('What is the meaning of life?');
    expect(chatMessages[0].answer).toContain('I received your question');
    expect(chatMessages[0].created_at).toBeInstanceOf(Date);
    expect(chatMessages[0].id).toEqual(result.id);
  });

  it('should handle different question types', async () => {
    const mathQuestion: AskQuestionInput = {
      question: 'What is 2 + 2?'
    };

    const result = await askQuestion(mathQuestion);

    expect(result.question).toEqual('What is 2 + 2?');
    expect(result.answer).toContain('What is 2 + 2?');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const chatMessages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(chatMessages).toHaveLength(1);
    expect(chatMessages[0].question).toEqual('What is 2 + 2?');
  });

  it('should handle long questions', async () => {
    const longQuestion: AskQuestionInput = {
      question: 'This is a very long question that contains a lot of text to test how the system handles longer user inputs and whether it can process them correctly without any issues or truncation problems.'
    };

    const result = await askQuestion(longQuestion);

    expect(result.question).toEqual(longQuestion.question);
    expect(result.answer).toContain(longQuestion.question);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create multiple chat messages independently', async () => {
    const question1: AskQuestionInput = { question: 'First question?' };
    const question2: AskQuestionInput = { question: 'Second question?' };

    const result1 = await askQuestion(question1);
    const result2 = await askQuestion(question2);

    // Results should have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.question).toEqual('First question?');
    expect(result2.question).toEqual('Second question?');

    // Both should be in database
    const allMessages = await db.select()
      .from(chatMessagesTable)
      .execute();

    expect(allMessages).toHaveLength(2);
    
    const questions = allMessages.map(msg => msg.question);
    expect(questions).toContain('First question?');
    expect(questions).toContain('Second question?');
  });

  it('should maintain proper timestamps', async () => {
    const startTime = new Date();
    
    const result = await askQuestion(testInput);
    
    const endTime = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(endTime.getTime());
  });
});
