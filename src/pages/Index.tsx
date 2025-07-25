
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Gamepad2, BarChart, Users, Globe, Lightbulb, Target, CheckCircle, Star, MessageSquare, Zap, Shield, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartLearning = () => {
    navigate('/auth');
  };

  const handleTryDemo = () => {
    navigate('/demo');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/15 to-violet-600/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-violet-400/15 to-purple-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/8 to-pink-600/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Header />

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                onClick={handleStartLearning}
              >
                {t('cta.start')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                onClick={handleTryDemo}
              >
                {t('cta.demo')}
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('features.section.title')}</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                {t('features.section.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <Brain className="h-12 w-12 text-blue-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.adaptive.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.adaptive.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
                <MessageSquare className="h-12 w-12 text-purple-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.voice.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.voice.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
                <Lightbulb className="h-12 w-12 text-green-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.content.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.content.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:from-orange-500/20 hover:to-red-500/20 transition-all duration-300 backdrop-blur-sm">
                <Gamepad2 className="h-12 w-12 text-orange-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.gamified.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.gamified.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:from-teal-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <BarChart className="h-12 w-12 text-teal-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.analytics.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.analytics.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 backdrop-blur-sm">
                <Users className="h-12 w-12 text-indigo-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.collaborative.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.collaborative.desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Subject Coverage */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('subjects.title')}</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                {t('subjects.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "📚", title: t('subjects.mathematics.title'), desc: t('subjects.mathematics.desc') },
                { icon: "🔬", title: t('subjects.sciences.title'), desc: t('subjects.sciences.desc') },
                { icon: "📖", title: t('subjects.literature.title'), desc: t('subjects.literature.desc') },
                { icon: "🌍", title: t('subjects.social.title'), desc: t('subjects.social.desc') },
                { icon: "💻", title: t('subjects.technology.title'), desc: t('subjects.technology.desc') },
                { icon: "🎨", title: t('subjects.arts.title'), desc: t('subjects.arts.desc') },
                { icon: "🗣️", title: t('subjects.languages.title'), desc: t('subjects.languages.desc') },
                { icon: "🏃", title: t('subjects.health.title'), desc: t('subjects.health.desc') }
              ].map((subject, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="text-4xl mb-4">{subject.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{subject.title}</h3>
                  <p className="text-white/60 text-sm">{subject.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('advanced.title')}</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('advanced.adaptive.title')}</h3>
                    <p className="text-white/70">
                      {t('advanced.adaptive.desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Zap className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('advanced.feedback.title')}</h3>
                    <p className="text-white/70">
                      {t('advanced.feedback.desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('advanced.safe.title')}</h3>
                    <p className="text-white/70">
                      {t('advanced.safe.desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('advanced.availability.title')}</h3>
                    <p className="text-white/70">
                      {t('advanced.availability.desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t('achievement.title')}</h3>
                  <p className="text-white/70">
                    {t('achievement.desc')}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">{t('achievement.streak')}</span>
                    <span className="text-yellow-400 font-semibold">🔥 {t('achievement.progress')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">{t('achievement.problems')}</span>
                    <span className="text-green-400 font-semibold">⚡ {t('achievement.tracking')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">{t('achievement.level')}</span>
                    <span className="text-blue-400 font-semibold">🏆 {t('achievement.growing')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('testimonials.title')}</h2>
              <p className="text-xl text-white/70">{t('testimonials.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  role: t('testimonials.teacher'),
                  content: t('testimonials.teacher.content'),
                  rating: 5
                },
                {
                  name: "Michael Rodriguez",
                  role: t('testimonials.parent'),
                  content: t('testimonials.parent.content'),
                  rating: 5
                },
                {
                  name: "Dr. Emily Johnson",
                  role: t('testimonials.principal'),
                  content: t('testimonials.principal.content'),
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('pricing.title')}</h2>
              <p className="text-xl text-white/70">{t('pricing.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">{t('pricing.individual')}</h3>
                <div className="text-4xl font-bold mb-6">{t('pricing.individual.price')}<span className="text-lg text-white/60">{t('pricing.month')}</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.individual.feature1')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.individual.feature2')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.individual.feature3')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.individual.feature4')}</li>
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={handleStartLearning}
                >
                  {t('pricing.get.started')}
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 backdrop-blur-sm relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {t('pricing.most.popular')}
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('pricing.family')}</h3>
                <div className="text-4xl font-bold mb-6">{t('pricing.family.price')}<span className="text-lg text-white/60">{t('pricing.month')}</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.family.feature1')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.family.feature2')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.family.feature3')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.family.feature4')}</li>
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={handleStartLearning}
                >
                  {t('pricing.get.started')}
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">{t('pricing.school')}</h3>
                <div className="text-4xl font-bold mb-6">$32<span className="text-lg text-white/60">/month</span></div>
                <div className="text-sm text-white/70 mb-4">+ $3 for each additional student</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.school.feature1')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.school.feature2')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.school.feature3')}</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />{t('pricing.school.feature4')}</li>
                </ul>
                <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                  {t('pricing.contact.sales')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('faq.title')}</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: t('faq.q1'),
                  answer: t('faq.a1')
                },
                {
                  question: t('faq.q2'),
                  answer: t('faq.a2')
                },
                {
                  question: t('faq.q3'),
                  answer: t('faq.a3')
                },
                {
                  question: t('faq.q4'),
                  answer: t('faq.a4')
                },
                {
                  question: t('faq.q5'),
                  answer: t('faq.a5')
                },
                {
                  question: t('faq.q6'),
                  answer: t('faq.a6')
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-3 text-white">{faq.question}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about.title')}</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                {t('about.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">{t('about.vision.title')}</h3>
                <p className="text-white/80 leading-relaxed mb-6">
                  {t('about.vision.desc1')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('about.vision.desc2')}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6">{t('about.impact.title')}</h3>
                  <p className="text-white/70 mb-6">
                    {t('about.impact.desc')}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{t('about.impact.ai')}</div>
                      <div className="text-white/70 text-sm">{t('about.impact.learning')}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">{t('about.impact.global')}</div>
                      <div className="text-white/70 text-sm">{t('about.impact.accessibility')}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">{t('about.impact.adaptive')}</div>
                      <div className="text-white/70 text-sm">{t('about.impact.curriculum')}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-400 mb-1">{t('about.impact.realtime')}</div>
                      <div className="text-white/70 text-sm">{t('about.impact.analytics')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('contact.title')}</h2>
              <p className="text-xl text-white/70">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
              <form className="space-y-6">
                <div>
                  <label className="block text-white/80 mb-2">{t('contact.form.name')}</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder={t('contact.form.name.placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">{t('contact.form.email')}</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder={t('contact.form.email.placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">{t('contact.form.message')}</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
                    placeholder={t('contact.form.message.placeholder')}
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  {t('contact.form.send')}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-12 border border-white/10 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('final.cta.title')}</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('final.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg"
                  onClick={handleStartLearning}
                >
                  Start Learning
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                  onClick={handleTryDemo}
                >
                  {t('final.cta.demo')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <RoleSelection 
        isOpen={showRoleSelection} 
        onClose={() => setShowRoleSelection(false)} 
      />
    </div>
  );
};

export default Index;
