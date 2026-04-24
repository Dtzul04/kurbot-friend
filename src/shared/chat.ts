export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  reply: string;
};

export type SavedChatMessage = {
  sender: 'you' | 'kurbot';
  text: string;
};

export type ChatHistoryResponse = {
  messages: SavedChatMessage[];
};