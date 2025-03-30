
import { MessageSquare, Mic, Timer, LogOut } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  {
    title: "Chat",
    icon: MessageSquare,
    url: "/features",
  },
  {
    title: "Voice Messages",
    icon: Mic,
    url: "/voice",
  },
  {
    title: "Token Usage",
    icon: Timer,
    url: "/tokens",
  },
  {
    title: "Log Out",
    icon: LogOut,
    url: "/",
  },
];

export function AppSidebar() {
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r border-white/20">
      <SidebarHeader className="px-6 py-3">
        <h1 className="text-xl font-bold">EduAI</h1>
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
                      onClick={() => navigate(item.url)} 
                      className="flex items-center w-full text-left"
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
  );
}
