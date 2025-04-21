
import { MessageSquare, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export function AppSidebar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleNavigation = (url: string) => {
    if (url === '/logout') {
      handleLogout();
    } else {
      console.log(`Navigating to: ${url}`);
      navigate(url);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/pricing');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      title: "Chat",
      icon: MessageSquare,
      url: "/voice",
    },
    // Removed 3D Learning here
    {
      title: "Log Out",
      icon: LogOut,
      url: "/logout",
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-white/20">
        <SidebarHeader className="px-6 py-3">
          <h1 className="text-xl font-bold">Teachly</h1>
          <SidebarTrigger className="ml-auto" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <button 
                        onClick={() => handleNavigation(item.url)} 
                        className="flex items-center w-full text-left"
                        data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
