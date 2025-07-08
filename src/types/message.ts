
export interface Message {
  id?: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  type: 'text' | 'voice' | 'file';
  audioUrl?: string;
  audioContent?: string;
  isPlaying?: boolean;
  fileUrl?: string;
  fileName?: string;
  tokenCount: number;
}
