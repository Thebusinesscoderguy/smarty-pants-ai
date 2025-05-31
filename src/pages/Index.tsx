
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Learn Faster with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Teachly uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
            </p>
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700 h-16 px-12"
              onClick={() => navigate('/pricing')}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-blue-400 text-2xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-white/70">Our AI adjusts to your learning pace, slowing down when you need time and speeding up when you're flying.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-purple-400 text-2xl mb-4">🗣️</div>
              <h3 className="text-xl font-semibold mb-2">Voice Interactions</h3>
              <p className="text-white/70">Learn on the go with natural voice conversations. Ask questions and get answers just like talking to a tutor.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-green-400 text-2xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Study Material Analysis</h3>
              <p className="text-white/70">Upload your notes and documents, and our AI will help you understand and quiz you on the content.</p>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Gamified Learning Experience</h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-yellow-400 text-3xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-4">Achievements & Rewards</h3>
                <p className="text-white/70">Unlock badges, earn points, and level up as you progress through your learning journey. Our gamification system keeps students motivated with meaningful rewards for completing lessons, maintaining study streaks, and mastering difficult concepts.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-blue-400 text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-4">Progress Tracking</h3>
                <p className="text-white/70">Visual progress indicators, learning analytics, and detailed performance insights help students understand their strengths and areas for improvement. Set goals, track daily study time, and celebrate milestones along the way.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-purple-400 text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-4">Challenges & Quests</h3>
                <p className="text-white/70">Engage with daily challenges, weekly quests, and special learning events. Complete subject-specific missions, participate in knowledge competitions, and climb leaderboards while building real understanding.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-green-400 text-3xl mb-4">⭐</div>
                <h3 className="text-xl font-semibold mb-4">Customizable Experience</h3>
                <p className="text-white/70">Personalize your learning environment with themes, avatars, and study preferences. Set notification schedules, choose reward types, and create a learning space that motivates you to succeed.</p>
              </div>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Parent & Teacher Monitoring</h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-orange-400 text-3xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-semibold mb-4">Parent Dashboard</h3>
                <p className="text-white/70">Stay connected with your child's learning journey through comprehensive progress reports, achievement notifications, and study time analytics. Monitor completion rates, identify learning patterns, and support your child's educational goals with detailed insights into their strengths and areas needing attention.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-red-400 text-3xl mb-4">👩‍🏫</div>
                <h3 className="text-xl font-semibold mb-4">Teacher Analytics</h3>
                <p className="text-white/70">Empower educators with detailed student performance analytics, assignment tracking, and learning outcome assessments. Generate progress reports, identify students who need additional support, and customize learning paths based on individual student needs and classroom objectives.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-cyan-400 text-3xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-4">Real-time Insights</h3>
                <p className="text-white/70">Access live learning data, study session reports, and immediate notifications when students achieve milestones or need help. Track engagement levels, time spent on different subjects, and learning velocity to make informed decisions about educational support.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <div className="text-pink-400 text-3xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-4">Custom Reports</h3>
                <p className="text-white/70">Generate detailed progress reports for parent-teacher conferences, academic reviews, and educational planning. Export data in multiple formats, schedule automated report delivery, and create custom metrics that align with educational standards and learning objectives.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Why Choose Teachly in 2025?</h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Personalized Learning Path</h3>
                <p className="text-white/70">Our AI analyzes your learning style, strengths, and weaknesses to create a custom curriculum that evolves as you progress.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Real-time Feedback</h3>
                <p className="text-white/70">Get immediate, constructive feedback on your work that helps you understand mistakes and improve faster.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Interactive Practice</h3>
                <p className="text-white/70">Engage with dynamic exercises that adapt to your skill level, making learning both challenging and enjoyable.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Learn Anywhere</h3>
                <p className="text-white/70">Access your personalized learning experience on any device, with progress synced automatically across platforms.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Frequently Asked Questions</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12">
              Find answers to common questions about using Teachly and maximizing your learning experience.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">How does adaptive learning work?</h3>
                <p className="text-white/70 mb-3">Our AI system analyzes your learning patterns and adjusts the difficulty and pace of content to match your individual needs, creating a personalized experience that evolves as you progress.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">How does voice learning work?</h3>
                <p className="text-white/70 mb-3">Our voice learning feature allows you to have natural conversations with our AI tutor. You can ask questions and receive spoken responses, making learning more interactive and engaging.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-green-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">What content can Teachly help me with?</h3>
                <p className="text-white/70 mb-3">Teachly can assist with a wide range of subjects including mathematics, science, languages, programming, and more. Our AI adapts to your specific learning needs.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-yellow-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">Can I use Teachly on mobile devices?</h3>
                <p className="text-white/70 mb-3">Yes! Teachly is fully responsive and works on all devices including smartphones and tablets. Your learning progress syncs across all platforms automatically.</p>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
