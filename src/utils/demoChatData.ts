
// Demo chat data for non-authenticated users
export interface DemoChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: DemoMessage[];
}

export interface DemoMessage {
  id: string;
  content: string;
  is_from_user: boolean;
  created_at: string;
  audioUrl?: string;
}

export const demoChatSessions: DemoChatSession[] = [
  {
    id: 'math-help-1',
    title: 'Algebra Help',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:15:00Z',
    messages: [
      {
        id: 'msg-1',
        content: "Can you help me solve quadratic equations?",
        is_from_user: true,
        created_at: '2024-01-20T10:00:00Z'
      },
      {
        id: 'msg-2',
        content: "I'd be happy to help you with quadratic equations! A quadratic equation is in the form ax² + bx + c = 0. There are several methods to solve them:\n\n1. **Factoring** - when the equation can be factored easily\n2. **Quadratic Formula** - x = (-b ± √(b² - 4ac)) / 2a\n3. **Completing the Square** - useful for understanding the vertex form\n\nWhich method would you like to start with, or do you have a specific equation you're working on?",
        is_from_user: false,
        created_at: '2024-01-20T10:00:30Z'
      },
      {
        id: 'msg-3',
        content: "Let's try the quadratic formula with x² - 5x + 6 = 0",
        is_from_user: true,
        created_at: '2024-01-20T10:02:00Z'
      },
      {
        id: 'msg-4',
        content: "Perfect! Let's solve x² - 5x + 6 = 0 using the quadratic formula.\n\nFirst, identify the coefficients:\n- a = 1\n- b = -5  \n- c = 6\n\nNow apply the formula: x = (-b ± √(b² - 4ac)) / 2a\n\nx = (-(-5) ± √((-5)² - 4(1)(6))) / 2(1)\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± √1) / 2\nx = (5 ± 1) / 2\n\nSo: x = (5 + 1)/2 = 3 or x = (5 - 1)/2 = 2\n\nThe solutions are x = 2 and x = 3. You can verify by substituting back into the original equation!",
        is_from_user: false,
        created_at: '2024-01-20T10:02:45Z'
      }
    ]
  },
  {
    id: 'science-help-1',
    title: 'Physics Concepts',
    created_at: '2024-01-19T14:30:00Z',
    updated_at: '2024-01-19T14:45:00Z',
    messages: [
      {
        id: 'msg-5',
        content: "What's the difference between velocity and speed?",
        is_from_user: true,
        created_at: '2024-01-19T14:30:00Z'
      },
      {
        id: 'msg-6',
        content: "Great question! This is a common source of confusion in physics.\n\n**Speed** is a scalar quantity:\n- Only has magnitude (how fast)\n- Always positive\n- Example: \"The car is traveling at 60 mph\"\n\n**Velocity** is a vector quantity:\n- Has both magnitude AND direction\n- Can be positive or negative\n- Example: \"The car is traveling at 60 mph north\"\n\n**Key differences:**\n1. Speed tells you how fast, velocity tells you how fast AND which way\n2. If you're going in a circle at constant speed, your velocity is constantly changing (because direction changes)\n3. Average speed = total distance / time, but average velocity = displacement / time\n\nThink of it this way: if you run around a track and end up where you started, your average velocity is zero (no displacement), but your average speed is definitely not zero!",
        is_from_user: false,
        created_at: '2024-01-19T14:30:45Z'
      }
    ]
  },
  {
    id: 'writing-help-1',
    title: 'Essay Structure',
    created_at: '2024-01-18T16:20:00Z',
    updated_at: '2024-01-18T16:35:00Z',
    messages: [
      {
        id: 'msg-7',
        content: "How do I structure a persuasive essay?",
        is_from_user: true,
        created_at: '2024-01-18T16:20:00Z'
      },
      {
        id: 'msg-8',
        content: "A persuasive essay follows a clear structure designed to convince your reader. Here's the standard format:\n\n**1. Introduction (Hook + Thesis)**\n- Start with an attention-grabbing hook\n- Provide background context\n- End with a clear thesis statement\n\n**2. Body Paragraphs (3-4 paragraphs)**\n- Each paragraph = one main argument\n- Start with a topic sentence\n- Provide evidence and examples\n- Address counterarguments\n\n**3. Conclusion**\n- Restate thesis (in different words)\n- Summarize main points\n- End with a call to action or thought-provoking statement\n\n**Pro tips:**\n- Use transition words between paragraphs\n- Include credible sources and statistics\n- Appeal to logic, emotion, and credibility\n- Consider your audience's perspective\n\nWhat topic are you writing about? I can help you develop specific arguments!",
        is_from_user: false,
        created_at: '2024-01-18T16:21:00Z'
      }
    ]
  }
];

export const getDemoChatSessions = () => demoChatSessions;

export const getDemoSession = (sessionId: string) => 
  demoChatSessions.find(session => session.id === sessionId);

export const getDemoResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('math') || message.includes('equation') || message.includes('algebra')) {
    return "I'd be happy to help with math! Whether it's algebra, geometry, calculus, or any other math topic, I can break down problems step by step. What specific math concept or problem are you working on?";
  }
  
  if (message.includes('science') || message.includes('physics') || message.includes('chemistry')) {
    return "Science is fascinating! I can help explain concepts in physics, chemistry, biology, and more. I love breaking down complex scientific ideas into understandable explanations. What science topic interests you?";
  }
  
  if (message.includes('write') || message.includes('essay') || message.includes('grammar')) {
    return "Writing is a great skill to develop! I can help with essay structure, grammar, creative writing, research papers, and more. Whether you need help brainstorming ideas or polishing your final draft, I'm here to assist. What type of writing are you working on?";
  }
  
  if (message.includes('history') || message.includes('literature')) {
    return "History and literature are rich subjects full of fascinating stories and insights! I can help you understand historical events, analyze literary works, or explore connections between different time periods and cultures. What period or work interests you?";
  }
  
  // Default responses
  const defaultResponses = [
    "That's an interesting question! I'm here to help you learn and understand any topic. Could you tell me more about what you'd like to explore?",
    "I'd be happy to help you with that! Learning is all about curiosity and asking good questions. What specific aspect would you like to dive deeper into?",
    "Great question! I love helping students discover new concepts and master challenging topics. What subject area are you most interested in right now?",
    "I'm here to support your learning journey! Whether it's homework help, concept explanations, or just satisfying your curiosity, I'm ready to help. What can we explore together?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};
