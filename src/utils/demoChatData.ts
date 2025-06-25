
export interface DemoMessage {
  id: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  type: 'text' | 'voice' | 'file';
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  tokenCount: number;
}

export interface DemoSession {
  id: string;
  title: string;
  created_at: string;
  messages: DemoMessage[];
}

const demoSessions: DemoSession[] = [
  {
    id: 'demo-math-session',
    title: 'Advanced Algebra Help',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    messages: [
      {
        id: 'demo-msg-1',
        text: "Hi! I need help with quadratic equations. Can you explain how to solve x² + 5x + 6 = 0?",
        timestamp: new Date(Date.now() - 3600000),
        isFromUser: true,
        type: 'text',
        tokenCount: 25
      },
      {
        id: 'demo-msg-2',
        text: "I'd be happy to help you solve that quadratic equation! Let's work through x² + 5x + 6 = 0 step by step.\n\nWe can solve this using factoring:\n1. Look for two numbers that multiply to 6 and add to 5\n2. Those numbers are 2 and 3 (2×3=6, 2+3=5)\n3. So we can write: (x + 2)(x + 3) = 0\n4. This gives us x = -2 or x = -3\n\nWould you like me to show you the quadratic formula method as well?",
        timestamp: new Date(Date.now() - 3590000),
        isFromUser: false,
        type: 'text',
        tokenCount: 120
      },
      {
        id: 'demo-msg-3',
        text: "Yes, please show me the quadratic formula method too!",
        timestamp: new Date(Date.now() - 3580000),
        isFromUser: true,
        type: 'text',
        tokenCount: 15
      },
      {
        id: 'demo-msg-4',
        text: "Perfect! The quadratic formula is: x = (-b ± √(b² - 4ac)) / 2a\n\nFor x² + 5x + 6 = 0:\n- a = 1, b = 5, c = 6\n- x = (-5 ± √(25 - 24)) / 2\n- x = (-5 ± √1) / 2\n- x = (-5 ± 1) / 2\n\nSo: x = (-5 + 1)/2 = -2 or x = (-5 - 1)/2 = -3\n\nSame answers! Both methods work great for different types of problems.",
        timestamp: new Date(Date.now() - 3570000),
        isFromUser: false,
        type: 'text',
        tokenCount: 140
      }
    ]
  },
  {
    id: 'demo-science-session',
    title: 'Photosynthesis Explanation',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    messages: [
      {
        id: 'demo-sci-1',
        text: "Can you explain photosynthesis in simple terms?",
        timestamp: new Date(Date.now() - 172800000),
        isFromUser: true,
        type: 'text',
        tokenCount: 12
      },
      {
        id: 'demo-sci-2',
        text: "Absolutely! Photosynthesis is how plants make their own food using sunlight. Here's the simple version:\n\n🌱 **What plants need:**\n- Sunlight (energy)\n- Carbon dioxide (from air)\n- Water (from roots)\n\n🔄 **What happens:**\nPlants capture sunlight with chlorophyll (the green stuff in leaves) and use it to combine CO₂ and water into glucose (sugar) and oxygen.\n\n📝 **The equation:**\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\n🎯 **Why it matters:**\n- Plants get food (glucose)\n- We get oxygen to breathe\n- It's the foundation of almost all life on Earth!\n\nThink of it as nature's solar panels converting sunlight into food energy!",
        timestamp: new Date(Date.now() - 172790000),
        isFromUser: false,
        type: 'text',
        tokenCount: 180
      }
    ]
  },
  {
    id: 'demo-history-session',
    title: 'World War II Overview',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    messages: [
      {
        id: 'demo-hist-1',
        text: "I have a test on World War II tomorrow. Can you give me a quick overview of the main events?",
        timestamp: new Date(Date.now() - 259200000),
        isFromUser: true,
        type: 'text',
        tokenCount: 25
      },
      {
        id: 'demo-hist-2',
        text: "I'll help you prepare! Here's a timeline of WWII's key events:\n\n**🔥 Start (1939-1941):**\n- Sept 1939: Germany invades Poland, war begins\n- 1940: Germany conquers France, Battle of Britain\n- Dec 1941: Pearl Harbor attack, US enters war\n\n**⚔️ Turning Points (1942-1943):**\n- 1942: Battle of Midway (Pacific)\n- 1942-1943: Battle of Stalingrad (Europe)\n- These battles stopped Axis expansion\n\n**🏆 Allied Victory (1944-1945):**\n- June 1944: D-Day invasion of Normandy\n- 1945: Germany surrenders (May 8)\n- Aug 1945: Atomic bombs, Japan surrenders\n\n**Key Players:** Allies (US, UK, USSR, France) vs Axis (Germany, Japan, Italy)\n\n**Major Themes:** Holocaust, technology advances, civilian impact, global cooperation\n\nWhat specific aspect would you like me to elaborate on for your test?",
        timestamp: new Date(Date.now() - 259190000),
        isFromUser: false,
        type: 'text',
        tokenCount: 220
      }
    ]
  }
];

export const getDemoChatSessions = (): DemoSession[] => {
  return demoSessions;
};

export const getDemoSessionById = (sessionId: string): DemoSession | undefined => {
  return demoSessions.find(session => session.id === sessionId);
};

export const createDemoMessage = (text: string, isFromUser: boolean): DemoMessage => {
  return {
    id: `demo-msg-${Date.now()}`,
    text,
    timestamp: new Date(),
    isFromUser,
    type: 'text',
    tokenCount: Math.ceil(text.length / 4)
  };
};
