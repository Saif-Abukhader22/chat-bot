import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKey: string | null = null;

  constructor() {
    // Try to get API key from localStorage first
    this.apiKey = localStorage.getItem('gemini-api-key');
    if (this.apiKey) {
      this.initializeClient();
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem('gemini-api-key', apiKey);
    this.initializeClient();
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  private initializeClient() {
    if (!this.apiKey) return;
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      throw error;
    }
  }

  async sendMessage(message: string, onStream?: (chunk: string) => void): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini client not initialized. Please set API key first.');
    }

    try {
      if (onStream) {
        // Streaming response
        const result = await this.model.generateContentStream(message);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          onStream(chunkText);
        }
        
        return fullResponse;
      } else {
        // Non-streaming response
        const result = await this.model.generateContent(message);
        return result.response.text();
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw error;
    }
  }

  async sendMessageWithHistory(
    message: string, 
    history: Message[], 
    onStream?: (chunk: string) => void
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini client not initialized. Please set API key first.');
    }

    try {
      // Create chat session with history
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      });

      if (onStream) {
        const result = await chat.sendMessageStream(message);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          onStream(chunkText);
        }
        
        return fullResponse;
      } else {
        const result = await chat.sendMessage(message);
        return result.response.text();
      }
    } catch (error) {
      console.error('Error sending message with history to Gemini:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.model !== null;
  }
}

export const geminiService = new GeminiService();