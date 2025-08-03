
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage, AskQuestionInput } from '../../server/src/schema';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load recent messages on mount
  const loadRecentMessages = useCallback(async () => {
    try {
      const recentMessages = await trpc.getRecentMessages.query({ limit: 20 });
      setMessages(recentMessages);
    } catch (error) {
      console.error('Failed to load recent messages:', error);
    }
  }, []);

  useEffect(() => {
    loadRecentMessages();
  }, [loadRecentMessages]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      const input: AskQuestionInput = { question: currentQuestion };
      const response = await trpc.askQuestion.mutate(input);
      
      // Add the new message to the chat
      setMessages((prev: ChatMessage[]) => [...prev, response]);
    } catch (error) {
      console.error('Failed to ask question:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🤖 AI Chatbot</h1>
          <p className="text-gray-600">Ask me anything and I'll do my best to help!</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-700">Chat</CardTitle>
            <Separator />
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Chat Messages Area */}
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-96 w-full rounded-md border bg-gray-50/50 p-4"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg">Start a conversation!</p>
                  <p className="text-sm">Type your question below to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: ChatMessage) => (
                    <div key={message.id} className="space-y-3">
                      {/* User Question */}
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                          <p className="text-sm font-medium">You</p>
                          <p>{message.question}</p>
                        </div>
                      </div>
                      
                      {/* AI Answer */}
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                          <p className="text-sm font-medium text-blue-600">🤖 AI Assistant</p>
                          <p>{message.answer}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {message.created_at.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={question}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                disabled={isLoading}
                className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                maxLength={1000}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !question.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  '🚀 Send'
                )}
              </Button>
            </form>

            {/* Helper Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Press Enter to send • Max 1000 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500">
          <p className="text-sm">
            This is a demo AI chatbot. Responses are currently generated using placeholder logic.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
