
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatarUrl, 
  size = 'md',
  className = '' 
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className} border border-white/20`}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="User avatar" />
      ) : null}
      <AvatarFallback className="bg-gray-700 text-white">
        <User className="h-1/2 w-1/2" />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
