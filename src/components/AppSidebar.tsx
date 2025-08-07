
import { 
  Home, 
  MessageSquare, 
  Mic, 
  Calculator, 
  TrendingUp, 
  CreditCard, 
  LogOut, 
  User,
  FileQuestion,
  Settings,
  Users,
  BookOpen,
  TestTube,
  Monitor,
  Wrench
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";

const navigationItems = [
  { title: "Home", icon: Home, url: "/" },
  { title: "Chat", icon: MessageSquare, url: "/chat" },
  { title: "Modules", icon: BookOpen, url: "/modules" },
  { title: "Progress", icon: TrendingUp, url: "/progress" },
];

const toolsItems = [
  { title: "Quiz Generator", icon: FileQuestion, url: "/quiz" },
  { title: "Math Solver", icon: Calculator, url: "/math-solver" },
  { title: "Voice Chat", icon: Mic, url: "/voice" },
];

const managementItems = [
  { title: "Monitoring", icon: Monitor, url: "/monitoring" },
  { title: "Settings", icon: Settings, url: "/settings" },
];

const AppSidebar = () => {
  const { user, signOut, isSchoolAdmin, isSigningOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      console.log('AppSidebar: Sign out already in progress');
      return;
    }
    
    try {
      console.log('AppSidebar: Starting sign out process...');
      
      await signOut();
      
      console.log('AppSidebar: Sign out successful, navigating to home');
      navigate('/', { replace: true });
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('AppSidebar: Sign out error:', error);
      
      // Even if sign out failed, navigate home since state was cleared
      navigate('/', { replace: true });
      
      toast({
        title: "Session ended",
        description: "You have been logged out. If issues persist, please refresh the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="md:block hidden">
        <SidebarContent>
          {user ? (
            <SidebarMenu>
              <SidebarGroup>
                <SidebarGroupLabel>Main</SidebarGroupLabel>
                <SidebarGroupContent>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title} className={isActive(item.url) ? "active" : ""}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
              
              <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarGroupContent>
                  {toolsItems.map((item) => (
                    <SidebarMenuItem key={item.title} className={isActive(item.url) ? "active" : ""}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Management</SidebarGroupLabel>
                <SidebarGroupContent>
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.title} className={isActive(item.url) ? "active" : ""}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/onboarding">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {isSchoolAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/school-admin">
                          <Users className="mr-2 h-4 w-4" />
                          <span>School Admin</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/pricing">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Subscription</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Button 
                        variant="ghost" 
                        onClick={handleSignOut} 
                        className="justify-start w-full"
                        disabled={isSigningOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{isSigningOut ? 'Signing out...' : 'Logout'}</span>
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarMenu>
          ) : (
            <SidebarMenu>
              <SidebarGroup>
                <SidebarGroupLabel>General</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/">
                        <Home className="mr-2 h-4 w-4" />
                        <span>Home</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/pricing">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Pricing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarMenu>
          )}
          <SidebarFooter>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Teachly. All rights reserved.
            </p>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
};

export { AppSidebar };
