import { useState } from 'react';
import { Calendar, Clock, Flag, MoreHorizontal, Trash2, Edit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, isToday, isPast } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt?: Date;
  isShared?: boolean;
  canEdit?: boolean;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => void;
  viewMode?: 'card' | 'list';
}

export const TaskCard = ({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onShare, 
  onStatusChange,
  viewMode = 'card'
}: TaskCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'in-progress';
      case 'in-progress': return 'completed';
      case 'completed': return 'pending';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Start';
      case 'in-progress': return 'Complete';
      case 'completed': return 'Reopen';
      default: return 'Update';
    }
  };

  const handleToggleComplete = () => {
    setIsCompleting(true);
    setTimeout(() => {
      onToggleComplete(task.id);
      setIsCompleting(false);
    }, 500);
  };

  const handleStatusChange = () => {
    if (onStatusChange) {
      const nextStatus = getNextStatus(task.status) as 'pending' | 'in-progress' | 'completed';
      onStatusChange(task.id, nextStatus);
    }
  };

  const isOverdue = isPast(task.dueDate) && task.status !== 'completed';
  const isDueToday = isToday(task.dueDate);
  const canEdit = task.canEdit !== false;

  if (viewMode === 'list') {
    return (
      <div className={`bg-white border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200 ${
        task.status === 'completed' ? 'opacity-60' : ''
      } ${isCompleting ? 'animate-task-complete' : ''}`}>
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          {/* Title Row with Checkbox and Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={handleToggleComplete}
                disabled={!canEdit}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium text-gray-900 ${
                    task.status === 'completed' ? 'line-through' : ''
                  }`}>
                    {task.title}
                  </h3>
                  {task.isShared && (
                    <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                  {!canEdit && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      View Only
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Right Side */}
            <div className="flex items-center gap-2 ml-2">
              {canEdit && onStatusChange && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStatusChange}
                  className="text-xs h-7 px-2"
                >
                  {getStatusLabel(task.status)}
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border shadow-lg">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onShare && canEdit && (
                    <DropdownMenuItem onClick={() => onShare(task)}>
                      <Users className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Badges Row - Left Side */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
              <Flag className="h-3 w-3 mr-1" />
              {task.priority}
            </Badge>
            
            <Badge className={`${getStatusColor(task.status)} text-xs`}>
              {task.status}
            </Badge>
            
            <div className={`flex items-center text-xs ${
              isOverdue ? 'text-red-600' : isDueToday ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <Calendar className="h-3 w-3 mr-1" />
              {format(task.dueDate, 'MMM dd')}
            </div>
            
            {task.createdAt && (
              <div className="text-xs text-gray-400">
                Created: {format(task.createdAt, 'dd/MM/yyyy')}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleToggleComplete}
              disabled={!canEdit}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium text-gray-900 truncate ${
                  task.status === 'completed' ? 'line-through' : ''
                }`}>
                  {task.title}
                </h3>
                {task.isShared && (
                  <Users className="h-4 w-4 text-blue-600" />
                )}
                {!canEdit && (
                  <Badge variant="outline" className="text-xs">
                    View Only
                  </Badge>
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 truncate">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
              <Flag className="h-3 w-3 mr-1" />
              {task.priority}
            </Badge>
            
            <Badge className={`${getStatusColor(task.status)} text-xs`}>
              {task.status}
            </Badge>
            
            <div className={`flex items-center text-sm ${
              isOverdue ? 'text-red-600' : isDueToday ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <Calendar className="h-4 w-4 mr-1" />
              {format(task.dueDate, 'MMM dd')}
            </div>
            
            {task.createdAt && (
              <div className="text-sm text-gray-400">
                Created: {format(task.createdAt, 'dd/MM/yyyy')}
              </div>
            )}
            
            {canEdit && onStatusChange && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStatusChange}
                className="text-xs h-8"
              >
                {getStatusLabel(task.status)}
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border shadow-lg">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onShare && canEdit && (
                  <DropdownMenuItem onClick={() => onShare(task)}>
                    <Users className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${
      task.status === 'completed' ? 'opacity-60' : ''
    } ${isCompleting ? 'animate-task-complete' : ''} relative`}>
      {task.isShared && (
        <div className="absolute top-2 right-2">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
      )}
      
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleToggleComplete}
              className="mt-1"
              disabled={!canEdit}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h3 className={`font-semibold text-gray-900 truncate ${
                  task.status === 'completed' ? 'line-through' : ''
                }`}>
                  {task.title}
                </h3>
                {!canEdit && (
                  <Badge variant="outline" className="text-xs w-fit">
                    View Only
                  </Badge>
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                  {task.description}
                </p>
              )}
              
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                    <Flag className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                    {task.priority}
                  </Badge>
                  
                  <Badge className={`${getStatusColor(task.status)} text-xs`}>
                    {task.status}
                  </Badge>
                  
                  <div className={`flex items-center text-xs ${
                    isOverdue ? 'text-red-600' : isDueToday ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(task.dueDate, 'MMM dd')}
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  {canEdit && onStatusChange && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStatusChange}
                      className="text-xs h-6 px-2"
                    >
                      {getStatusLabel(task.status)}
                    </Button>
                  )}
                </div>
              </div>
              
              {task.createdAt && (
                <div className="text-xs text-gray-400 mt-2">
                  Created: {format(task.createdAt, 'dd/MM/yyyy')}
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onShare && canEdit && (
                <DropdownMenuItem onClick={() => onShare(task)}>
                  <Users className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};