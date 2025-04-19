
export interface Message {
  id?: string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  fileUrl?: string;
  fileName?: string;
  isFromUser: boolean;
  type: 'text' | 'voice' | 'file';
  tokenCount?: number;
}

export interface MessageFromDB {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_from_user: boolean;
  type: string;
  file_url: string | null;
  file_name?: string | null;
  description?: string | null;
}
