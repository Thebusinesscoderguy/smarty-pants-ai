
import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatarUrl, 
  size = 'md',
  className = '',
  animated = false
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} border border-white/20 ${animated ? 'animate-pulse' : ''} rounded-full bg-gray-700 flex items-center justify-center overflow-hidden`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
      ) : (
        <User className="h-1/2 w-1/2 text-white" />
      )}
    </div>
  );
};

export default UserAvatar;
