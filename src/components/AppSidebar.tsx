
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
  Users
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
  { title: "Features", icon: MessageSquare, url: "/features" },
  { title: "Voice Chat", icon: Mic, url: "/voice" },
  { title: "Math Solver", icon: Calculator, url: "/math" },
  { title: "Quiz Generator", icon: FileQuestion, url: "/quiz" },
  { title: "Progress", icon: TrendingUp, url: "/progress" },
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
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title} className={isActive(item.url) ? "active" : ""}>
                      <Link to={item.url} className="w-full">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenuItem>
                    <Link to="/onboarding" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuItem>
                  {isSchoolAdmin && (
                    <SidebarMenuItem>
                      <Link to="/school-admin" className="w-full">
                        <Users className="mr-2 h-4 w-4" />
                        <span>School Admin</span>
                      </Link>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <Link to="/pricing" className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Button 
                      variant="ghost" 
                      onClick={handleSignOut} 
                      className="justify-start w-full"
                      disabled={isSigningOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isSigningOut ? 'Signing out...' : 'Logout'}</span>
                    </Button>
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
                    <Link to="/" className="w-full">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link to="/pricing" className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Pricing</span>
                    </Link>
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
