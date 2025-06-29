
import { useState } from 'react';
import { BarChart3, CheckSquare, Users, User, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  taskCounts: {
    all: number;
    today: number;
    overdue: number;
    completed: number;
  };
  onNewTask: () => void;
}

export const Sidebar = ({ onFilterChange, activeFilter, taskCounts, onNewTask }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      path: '/',
      count: null 
    },
    { 
      id: 'tasks', 
      label: 'My Tasks', 
      icon: CheckSquare, 
      path: '/tasks',
      count: taskCounts.all 
    },
    { 
      id: 'shared', 
      label: 'Shared Tasks', 
      icon: Users, 
      path: '/shared',
      count: 0 
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/profile',
      count: null 
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      });
    }
  };

  const isActive = (item: any) => {
    return location.pathname === item.path;
  };

  const getGravatarUrl = (email: string) => {
    const hash = btoa(email.toLowerCase().trim()).replace(/[+/]/g, '_').replace(/=/g, '');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=40`;
  };

  const handleMenuClick = (path: string) => {
    // This function handles the navigation
    // The actual navigation is handled by the Link component
  };

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">Manage your tasks efficiently</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                  active 
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <Badge variant={active ? "default" : "secondary"} className="text-xs">
                    {item.count}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-100 space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.email ? getGravatarUrl(user.email) : undefined} 
              alt="Profile" 
            />
            <AvatarFallback className="bg-indigo-100 text-indigo-700">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={onNewTask}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full text-gray-600 hover:text-gray-800 border-gray-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
