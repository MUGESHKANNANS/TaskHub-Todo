import { Calendar, CheckSquare, Clock, Flag, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/components/TaskCard';
import { isToday, isPast } from 'date-fns';

interface DashboardStatsProps {
  tasks: Task[];
}

export const DashboardStats = ({ tasks }: DashboardStatsProps) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    inProgress: tasks.filter(task => task.status === 'in-progress').length,
    pending: tasks.filter(task => task.status === 'pending').length,
    dueToday: tasks.filter(task => isToday(task.dueDate) && task.status !== 'completed').length,
    overdue: tasks.filter(task => isPast(task.dueDate) && task.status !== 'completed').length,
    sharedWithMe: tasks.filter(task => task.isShared).length
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${stats.completed} completed, ${stats.pending + stats.inProgress} active`
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Currently working on'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Flag,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Awaiting action'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Tasks finished'
    },
    {
      title: 'Shared with Me',
      value: stats.sharedWithMe,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Collaborative tasks'
    }
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</CardTitle>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};