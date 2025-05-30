
import { WolframAlphaResult } from '@/hooks/useMathSolver';

export interface Message {
  id?: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  type: 'text' | 'voice' | 'file';
  audioUrl?: string;
  isPlaying?: boolean;
  fileUrl?: string;
  fileName?: string;
  tokenCount: number;
  mathResult?: WolframAlphaResult;
}
