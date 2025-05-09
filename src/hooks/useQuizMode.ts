
import { useState } from 'react';
import { Message } from '@/types/message';

interface ResponseTime {
  question: string;
  responseTimeMs: number;
  wasCorrect: boolean;
}

export const useQuizMode = () => {
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState<Date | null>(null);
  const [responseTimes, setResponseTimes] = useState<ResponseTime[]>([]);
  const [userStrengths, setUserStrengths] = useState<string[]>([]);
  const [userWeaknesses, setUserWeaknesses] = useState<string[]>([]);

  // Helper functions for analyzing user performance
  const getLastQuestion = (messages: Message[]): string => {
    const aiMessages = messages.filter(m => !m.isFromUser);
    if (aiMessages.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1].text;
      return lastMessage;
    }
    return '';
  };

  const analyzeAnswerCorrectness = (answer: string, messages: Message[]): boolean => {
    // This is a simple placeholder implementation
    // In a real app, you would need a more sophisticated answer evaluation
    const lastQuestion = getLastQuestion(messages).toLowerCase();
    const userAnswer = answer.toLowerCase();
    
    // Simple example rules - this would be much more sophisticated in production
    if (lastQuestion.includes('capital of france') && userAnswer.includes('paris')) {
      return true;
    }
    if (lastQuestion.includes('2+2') && (userAnswer.includes('4') || userAnswer.includes('four'))) {
      return true;
    }
    
    // Default rule - assumes correct answers contain keywords from the question
    // This is very simplistic and would need to be improved
    const questionWords = lastQuestion.split(' ')
      .filter(word => word.length > 4)
      .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
    
    let correctWordCount = 0;
    questionWords.forEach(word => {
      if (userAnswer.includes(word)) {
        correctWordCount++;
      }
    });
    
    return correctWordCount > 0;
  };
  
  const analyzeUserPerformance = (responseData: ResponseTime[]) => {
    if (responseData.length < 2) return; // Need more data
    
    // Extract topics from questions (simple implementation)
    const topics = new Map<string, {
      totalTime: number,
      correctCount: number,
      incorrectCount: number,
      count: number
    }>();
    
    // Simple topic extraction - in production this would be more sophisticated
    responseData.forEach(data => {
      // Very basic topic extraction - would use NLP in production
      const possibleTopics = data.question.toLowerCase()
        .split(' ')
        .filter(word => word.length > 4)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
      
      const topic = possibleTopics[0] || 'general'; // Simplified
      
      if (!topics.has(topic)) {
        topics.set(topic, {
          totalTime: 0,
          correctCount: 0,
          incorrectCount: 0,
          count: 0
        });
      }
      
      const topicData = topics.get(topic)!;
      topicData.totalTime += data.responseTimeMs;
      if (data.wasCorrect) {
        topicData.correctCount++;
      } else {
        topicData.incorrectCount++;
      }
      topicData.count++;
    });
    
    // Analyze strengths (quick correct answers)
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    topics.forEach((data, topic) => {
      const averageTime = data.totalTime / data.count;
      const correctRatio = data.correctCount / data.count;
      
      if (correctRatio > 0.7 && data.count >= 2) {
        strengths.push(topic);
      }
      
      if (correctRatio < 0.5 || averageTime > 10000) { // More than 10 seconds
        weaknesses.push(topic);
      }
    });
    
    setUserStrengths(strengths);
    setUserWeaknesses(weaknesses);
  };
  
  const getFastResponseTopics = (): string => {
    if (responseTimes.length < 2) return 'Not enough data';
    
    const topicTimes = new Map<string, number[]>();
    
    responseTimes.forEach(data => {
      const topic = data.question.split(' ')[0].toLowerCase(); // Very simplified
      if (!topicTimes.has(topic)) {
        topicTimes.set(topic, []);
      }
      topicTimes.get(topic)!.push(data.responseTimeMs);
    });
    
    const fastTopics: string[] = [];
    
    topicTimes.forEach((times, topic) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime < 5000 && times.length > 1) { // Less than 5 seconds average
        fastTopics.push(topic);
      }
    });
    
    return fastTopics.join(', ') || 'None identified yet';
  };
  
  const getSlowResponseTopics = (): string => {
    if (responseTimes.length < 2) return 'Not enough data';
    
    const topicTimes = new Map<string, number[]>();
    
    responseTimes.forEach(data => {
      const topic = data.question.split(' ')[0].toLowerCase(); // Very simplified
      if (!topicTimes.has(topic)) {
        topicTimes.set(topic, []);
      }
      topicTimes.get(topic)!.push(data.responseTimeMs);
    });
    
    const slowTopics: string[] = [];
    
    topicTimes.forEach((times, topic) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime > 10000 && times.length > 1) { // More than 10 seconds average
        slowTopics.push(topic);
      }
    });
    
    return slowTopics.join(', ') || 'None identified yet';
  };
  
  const trackResponseTime = (userMessage: string, messages: Message[]) => {
    if (isQuizMode && lastQuestionTime) {
      const responseTimeMs = new Date().getTime() - lastQuestionTime.getTime();
      const isCorrectAnswer = analyzeAnswerCorrectness(userMessage, messages);
      
      const newResponseTime = {
        question: getLastQuestion(messages),
        responseTimeMs,
        wasCorrect: isCorrectAnswer
      };
      
      const updatedResponseTimes = [...responseTimes, newResponseTime];
      setResponseTimes(updatedResponseTimes);
      analyzeUserPerformance(updatedResponseTimes);
    }
  };

  return {
    isQuizMode,
    setIsQuizMode,
    lastQuestionTime,
    setLastQuestionTime,
    responseTimes,
    userStrengths,
    userWeaknesses,
    getFastResponseTopics,
    getSlowResponseTopics,
    trackResponseTime
  };
};
