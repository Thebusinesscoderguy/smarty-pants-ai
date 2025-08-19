import { useNavigate } from 'react-router-dom';
import LessonViewer from '@/components/learning/LessonViewer';

const LearningModule = () => {
  const navigate = useNavigate();

  // Simple lesson content
  const lesson = {
    id: 'lesson-1',
    title: 'Mathematics Fundamentals',
    content: `# Mathematics Fundamentals

## Introduction

Mathematics is the language of patterns, relationships, and logical reasoning. This lesson will help you understand key mathematical concepts that form the foundation for more advanced topics.

## Core Concepts

**Numbers and Operations**
Understanding different types of numbers (natural, whole, integers, rational, and irrational) and how to perform operations with them is fundamental to mathematics.

**Algebra Basics**
Algebra involves working with variables and expressions to solve problems. Key concepts include:
- Variables and constants
- Equations and inequalities
- Functions and their properties

**Geometry Principles**
Geometry deals with shapes, sizes, and spatial relationships:
- Points, lines, and planes
- Angles and their measurements  
- Polygons and their properties
- Area and perimeter calculations

## Practical Applications

Mathematics appears everywhere in daily life:
- Financial calculations and budgeting
- Measuring and construction projects
- Data analysis and statistics
- Technology and computer programming

## Problem-Solving Strategies

Effective mathematical problem-solving involves:
1. Understanding the problem clearly
2. Identifying what information is given
3. Determining what needs to be found
4. Choosing appropriate methods or formulas
5. Checking your answer for reasonableness`,
    duration: 30,
    type: 'reading' as const,
    completed: false
  };

  return (
    <LessonViewer 
      lesson={lesson}
      onBack={() => navigate('/quiz')}
      onComplete={() => navigate('/quiz')}
    />
  );
};

export default LearningModule;