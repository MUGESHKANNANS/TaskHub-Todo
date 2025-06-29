import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { MugeshFooter } from '@/components/MugeshFooter';
import { NotificationModal } from '@/components/NotificationModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { isToday, isPast } from 'date-fns';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  // Fetch tasks for task counts
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      // Fetch tasks
      const { data: ownedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id);

      const { data: sharedTasksData } = await supabase
        .from('task_shares')
        .select(`
          tasks (
            id,
            title,
            description,
            due_date,
            priority,
            status,
            user_id,
            created_at,
            updated_at
          )
        `)
        .eq('shared_with_user_id', user?.id);

      const sharedTasks = sharedTasksData?.map(item => item.tasks).filter(Boolean) || [];
      const allTasks = [...(ownedTasks || []), ...sharedTasks];
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter(task => isToday(new Date(task.due_date)) && task.status !== 'completed').length,
      overdue: tasks.filter(task => isPast(new Date(task.due_date)) && task.status !== 'completed').length,
      completed: tasks.filter(task => task.status === 'completed').length
    };
  }, [tasks]);

  const getGravatarUrl = (email: string) => {
    const hash = btoa(email.toLowerCase().trim()).replace(/[+/]/g, '_').replace(/=/g, '');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=40`;
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">TaskFlow</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <Link to="/profile">
            <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
              <AvatarImage 
                src={user?.email ? getGravatarUrl(user.email) : undefined} 
                alt="Profile" 
              />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            onFilterChange={() => {}} 
            activeFilter="all" 
            taskCounts={taskCounts}
            onNewTask={() => {}}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={closeSidebar} />
            <div className="relative w-64 bg-white h-full shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
                </div>
                <Button variant="ghost" size="sm" onClick={closeSidebar}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="h-full">
                <Sidebar 
                  onFilterChange={closeSidebar} 
                  activeFilter="all" 
                  taskCounts={taskCounts}
                  onNewTask={closeSidebar}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-64">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {location.pathname === '/' && 'Dashboard'}
                  {location.pathname === '/tasks' && 'My Tasks'}
                  {location.pathname === '/shared' && 'Shared Tasks'}
                  {location.pathname === '/profile' && 'Profile'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* User Avatar */}
                <Link to="/profile">
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
                    <AvatarImage 
                      src={user?.email ? getGravatarUrl(user.email) : undefined} 
                      alt="Profile" 
                    />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <MugeshFooter />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  );
};