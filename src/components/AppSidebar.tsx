
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
import { useUserRole } from "@/hooks/useUserRole";
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

// Child navigation - limited access
const childNavigationItems = [
  { title: "Chat", icon: MessageSquare, url: "/chat" },
  { title: "Study Tools", icon: BookOpen, url: "/modules" },
];

// Parent navigation - monitoring only
const parentNavigationItems = [
  { title: "Monitoring", icon: Monitor, url: "/monitoring" },
];

const managementItems = [
  { title: "Settings", icon: Settings, url: "/settings" },
];

// Keep admin items separate (hidden by default)
const adminItems = [
  { title: "School Admin", icon: Users, url: "/school-admin" },
  { title: "Monitoring", icon: Monitor, url: "/monitoring" },
];

const AppSidebar = () => {
  const { user, signOut, isSchoolAdmin, isSigningOut } = useAuth();
  const { userRole } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  // Prefer session role (chosen in Role Selector) over stored profile role
  const sessionRole = typeof window !== 'undefined'
    ? (localStorage.getItem('sessionRole') as 'student' | 'parent' | 'teacher' | null)
    : null;
  const effectiveRole = sessionRole ?? userRole;
  console.log('AppSidebar role state', { userRole, sessionRole, effectiveRole });

  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const getNavigationItems = () => {
    return effectiveRole === 'student' ? childNavigationItems : parentNavigationItems;
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      console.log('AppSidebar: Sign out already in progress');
      return;
    }
    
    try {
      console.log('AppSidebar: Starting sign out process...');
      
      await signOut();

      // Clear session role overrides
      try {
        localStorage.removeItem('sessionRole');
        localStorage.removeItem('sessionChildId');
      } catch {}
      
      console.log('AppSidebar: Sign out successful, navigating to home');
      navigate('/', { replace: true });
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('AppSidebar: Sign out error:', error);
      
      // Clear session role overrides even on error
      try {
        localStorage.removeItem('sessionRole');
        localStorage.removeItem('sessionChildId');
      } catch {}
      
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
                  {getNavigationItems().map((item) => (
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
              
              {/* Admin Section - Only show for school admins */}
              {isSchoolAdmin && effectiveRole !== 'student' && (
                <SidebarGroup>
                  <SidebarGroupLabel>Administration</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {adminItems.map((item) => (
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
              )}
              
              {/* Simple logout for everyone */}
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
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
