
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { getRecentMessages } from '../handlers/get_recent_messages';

describe('getRecentMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no messages exist', async () => {
    const result = await getRecentMessages();
    expect(result).toEqual([]);
  });

  it('should return messages in descending order by created_at', async () => {
    // Create test messages with different timestamps
    const firstMessage = await db.insert(chatMessagesTable)
      .values({
        question: 'First question',
        answer: 'First answer',
        created_at: new Date('2024-01-01T10:00:00Z')
      })
      .returning()
      .execute();

    const secondMessage = await db.insert(chatMessagesTable)
      .values({
        question: 'Second question',
        answer: 'Second answer',
        created_at: new Date('2024-01-01T11:00:00Z')
      })
      .returning()
      .execute();

    const thirdMessage = await db.insert(chatMessagesTable)
      .values({
        question: 'Third question',
        answer: 'Third answer',
        created_at: new Date('2024-01-01T12:00:00Z')
      })
      .returning()
      .execute();

    const result = await getRecentMessages();

    expect(result).toHaveLength(3);
    // Most recent message should be first
    expect(result[0].question).toEqual('Third question');
    expect(result[1].question).toEqual('Second question');
    expect(result[2].question).toEqual('First question');
  });

  it('should respect the limit parameter', async () => {
    // Create 5 test messages using different days to avoid hour overflow
    for (let i = 1; i <= 5; i++) {
      await db.insert(chatMessagesTable)
        .values({
          question: `Question ${i}`,
          answer: `Answer ${i}`,
          created_at: new Date(`2024-01-0${i}T10:00:00Z`)
        })
        .execute();
    }

    const result = await getRecentMessages(3);

    expect(result).toHaveLength(3);
    // Should get the 3 most recent messages (latest dates first)
    expect(result[0].question).toEqual('Question 5');
    expect(result[1].question).toEqual('Question 4');
    expect(result[2].question).toEqual('Question 3');
  });

  it('should use default limit of 10', async () => {
    // Create 15 test messages using different days
    for (let i = 1; i <= 15; i++) {
      const day = i < 10 ? `0${i}` : `${i}`;
      await db.insert(chatMessagesTable)
        .values({
          question: `Question ${i}`,
          answer: `Answer ${i}`,
          created_at: new Date(`2024-01-${day}T10:00:00Z`)
        })
        .execute();
    }

    const result = await getRecentMessages();

    expect(result).toHaveLength(10);
    // Should get the 10 most recent messages (latest dates first)
    expect(result[0].question).toEqual('Question 15');
    expect(result[9].question).toEqual('Question 6');
  });

  it('should return all fields correctly', async () => {
    const testMessage = await db.insert(chatMessagesTable)
      .values({
        question: 'Test question',
        answer: 'Test answer'
      })
      .returning()
      .execute();

    const result = await getRecentMessages();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].question).toEqual('Test question');
    expect(result[0].answer).toEqual('Test answer');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
