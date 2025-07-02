
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain, MessageSquare, BarChart3, User, Settings, LogOut, Menu, X, Send, Plus, School } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const Header = () => {
  const { user, signOut, isSchoolAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'suggestion',
    message: '',
    email: user?.email || ''
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleFeedbackSubmit = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: { ...feedback, userId: user?.id }
      });

      if (error) throw error;

      toast({
        title: "Feedback sent",
        description: "Thank you for your feedback! We'll review it soon.",
      });

      setFeedback({ type: 'suggestion', message: '', email: user?.email || '' });
      setShowFeedbackDialog(false);
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const navigationItems = [
    { href: '/chat', icon: MessageSquare, label: t('nav.chat') || 'Chat' },
    { href: '/progress', icon: BarChart3, label: t('nav.progress') || 'Progress' },
  ];

  if (isSchoolAdmin) {
    navigationItems.push({
      href: '/admin',
      icon: School,
      label: 'School Admin'
    });
  }

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">StudyBot</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-20 bg-transparent border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="es">ES</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="ru">RU</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-white">{user.email}</p>
                      {user.user_metadata?.full_name && (
                        <p className="text-xs text-gray-400">{user.user_metadata.full_name}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700" asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('nav.profile') || 'Profile'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700" asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t('nav.settings') || 'Settings'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  
                  {/* Feedback Dialog Trigger */}
                  <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        <span>Send Feedback</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Send Feedback</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="feedback-type">Type</Label>
                          <Select value={feedback.type} onValueChange={(value) => setFeedback({...feedback, type: value})}>
                            <SelectTrigger className="bg-gray-800 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="bug">Bug Report</SelectItem>
                              <SelectItem value="feature">Feature Request</SelectItem>
                              <SelectItem value="suggestion">Suggestion</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="feedback-email">Email</Label>
                          <Input
                            id="feedback-email"
                            value={feedback.email}
                            onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                            placeholder="your@email.com"
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="feedback-message">Message</Label>
                          <Textarea
                            id="feedback-message"
                            value={feedback.message}
                            onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                            placeholder="Tell us what you think..."
                            rows={4}
                            className="bg-gray-800 border-gray-600"
                          />
                        </div>
                        <Button 
                          onClick={handleFeedbackSubmit}
                          disabled={!feedback.message.trim()}
                          className="w-full"
                        >
                          Send Feedback
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('nav.signOut') || 'Sign out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    {t('nav.signIn') || 'Sign In'}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {t('nav.getStarted') || 'Get Started'}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-white/10">
              {navigationItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
