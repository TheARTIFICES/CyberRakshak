import { streamChatResponse } from "./api";

class ChatAssistantService {
  async sendStreamingMessage(
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    contextJobIds: string[] = [], // Added
    onChunk: (chunk: string) => void
  ): Promise<void> {
    let fullText = "";
    
    // Pass contextJobIds
    for await (const chunk of streamChatResponse(message, history, contextJobIds)) {
      fullText += chunk;
      onChunk(fullText); 
    }
  }
}

export default new ChatAssistantService();
