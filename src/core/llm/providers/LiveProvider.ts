import { GoogleGenAI, Modality } from '@google/genai';
import { LLMMessage, LLMResponse, LLMToolDefinition } from '../types';
import { LIVE_MODELS } from '../constants';

/**
 * LiveProvider — Uses the Gemini Live API (bidiGenerateContent)
 * for real-time chat. Unlimited RPD on free tier.
 *
 * DESIGN: Opens a short-lived WebSocket session per chat exchange,
 * sends the conversation, collects the full response, then closes.
 */
export class LiveProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateChatResponse(
    messages: LLMMessage[],
    tools?: LLMToolDefinition[],
    systemInstruction?: string,
    modelName: string = LIVE_MODELS.primary
  ): Promise<LLMResponse> {
    return new Promise(async (resolve, reject) => {
      let responseText = '';
      let timeoutId: ReturnType<typeof setTimeout>;
      let resolved = false;

      // Mutable ref — assigned AFTER connect() returns.
      // Callbacks use this instead of a const to avoid TDZ.
      let sessionRef: any = null;

      const safeResolve = (res: LLMResponse) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        resolve(res);
      };

      const closeSession = () => {
        try { sessionRef?.close(); } catch (_) { /* ignore */ }
      };

      // Prepare conversation turns ahead of time
      const turns = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' as const : 'user' as const,
          parts: [{ text: m.content }],
        }));

      try {
        sessionRef = await this.client.live.connect({
          model: modelName,
          config: {
            responseModalities: [Modality.TEXT],
            ...(systemInstruction ? {
              systemInstruction: { parts: [{ text: systemInstruction }] },
            } : {}),
          },
          callbacks: {
            onopen: () => {
              // sessionRef may not be assigned yet if onopen fires during connect().
              // Defer to next microtask to guarantee assignment.
              queueMicrotask(() => {
                if (!sessionRef || resolved) return;
                if (turns.length > 0) {
                  sessionRef.sendClientContent({
                    turns,
                    turnComplete: true,
                  });
                }

                // Safety timeout — close after 30s
                timeoutId = setTimeout(() => {
                  closeSession();
                  safeResolve({
                    content: responseText || 'I need a moment to think...',
                    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                  });
                }, 30000);
              });
            },
            onmessage: (message: any) => {
              if (message.serverContent?.modelTurn?.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.text) responseText += part.text;
                }
              }

              if (message.serverContent?.turnComplete) {
                closeSession();
                safeResolve({
                  content: responseText,
                  usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                });
              }
            },
            onerror: (error: any) => {
              console.error('[LiveProvider] WebSocket error:', error);
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                reject(error);
              }
            },
            onclose: () => {
              safeResolve({
                content: responseText || '',
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              });
            },
          },
        });
      } catch (error) {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      }
    });
  }
}
