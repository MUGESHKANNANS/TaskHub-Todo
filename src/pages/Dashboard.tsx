import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, SortAsc, Plus, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskCard, Task } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { TaskSharingModal } from '@/components/TaskSharingModal';
import { DashboardStats } from '@/components/DashboardStats';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isToday, isPast } from 'date-fns';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [loading, setLoading] = useState(true);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);

  const TASKS_PER_PAGE = 10;

  // Fetch tasks from Supabase
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      // Fetch tasks owned by the user
      const { data: ownedTasks, error: ownedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch tasks shared with the user
      const { data: sharedTasksData, error: sharedError } = await supabase
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
          ),
          permission
        `)
        .eq('shared_with_user_id', user?.id);

      if (sharedError) throw sharedError;

      // Extract shared tasks from the join result
      const sharedTasks = sharedTasksData?.map(item => ({
        ...item.tasks,
        canEdit: item.permission === 'edit',
        isShared: true
      })).filter(Boolean) || [];

      // Combine owned and shared tasks
      const allTasksData = [
        ...(ownedTasks || []).map(task => ({ ...task, canEdit: true, isShared: false })),
        ...sharedTasks
      ];

      // Transform the data to match our Task interface
      const transformedTasks: Task[] = allTasksData.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: new Date(task.due_date),
        priority: task.priority as 'low' | 'medium' | 'high',
        status: task.status as 'pending' | 'in-progress' | 'completed',
        createdAt: new Date(task.created_at),
        canEdit: task.canEdit,
        isShared: task.isShared
      }));

      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate task counts for sidebar
  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter(task => isToday(task.dueDate) && task.status !== 'completed').length,
      overdue: tasks.filter(task => isPast(task.dueDate) && task.status !== 'completed').length,
      completed: tasks.filter(task => task.status === 'completed').length
    };
  }, [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply text search
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply sidebar filter
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(task => isToday(task.dueDate) && task.status !== 'completed');
        break;
      case 'overdue':
        filtered = filtered.filter(task => isPast(task.dueDate) && task.status !== 'completed');
        break;
      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, activeFilter, sortBy, priorityFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.canEdit) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await handleStatusChange(taskId, newStatus);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.canEdit) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
      
      toast({
        title: `Task ${newStatus}`,
        description: `"${task.title}" has been updated.`,
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            title: taskData.title,
            description: taskData.description,
            due_date: taskData.dueDate.toISOString(),
            priority: taskData.priority,
            status: taskData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        setTasks(prev => prev.map(task => 
          task.id === editingTask.id 
            ? { 
                ...taskData, 
                id: editingTask.id, 
                createdAt: task.createdAt,
                canEdit: task.canEdit,
                isShared: task.isShared
              }
            : task
        ));
        
        toast({
          title: 'Task updated',
          description: `"${taskData.title}" has been updated successfully.`,
        });
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title: taskData.title,
            description: taskData.description,
            due_date: taskData.dueDate.toISOString(),
            priority: taskData.priority,
            status: taskData.status,
            user_id: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        const newTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          dueDate: new Date(data.due_date),
          priority: data.priority as 'low' | 'medium' | 'high',
          status: data.status as 'pending' | 'in-progress' | 'completed',
          createdAt: new Date(data.created_at),
          canEdit: true,
          isShared: false
        };

        setTasks(prev => [newTask, ...prev]);
        
        toast({
          title: 'Task created',
          description: `"${taskData.title}" has been created successfully.`,
        });
      }
      setEditingTask(undefined);
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to save task',
        variant: 'destructive'
      });
    }
  };

  const handleEditTask = (task: Task) => {
    if (!task.canEdit) {
      toast({
        title: 'Access Denied',
        description: 'You can only view this task. Edit access is not permitted.',
        variant: 'destructive'
      });
      return;
    }
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.canEdit) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: 'Task deleted',
        description: `"${task.title}" has been deleted.`,
        variant: 'destructive'
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };

  const handleShareTask = (task: Task) => {
    setSharingTask(task);
    setIsSharingModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setIsTaskFormOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search and Actions Bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks by title, description, or tags"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-0"
              />
            </div>
          </div>
          
          <Button onClick={handleNewTask} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-100">
        <DashboardStats tasks={tasks} />
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="dueDate">Sort by Due Date</SelectItem>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                  <SelectItem value="status">Sort by Status</SelectItem>
                  <SelectItem value="title">Sort by Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">
        {/* Task List */}
        {paginatedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first task to get started'}
            </p>
            <Button onClick={handleNewTask} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {paginatedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onShare={handleShareTask}
                    onStatusChange={handleStatusChange}
                    viewMode="list"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onShare={handleShareTask}
                    onStatusChange={handleStatusChange}
                    viewMode="card"
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </main>
      
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
      />

      <TaskSharingModal
        isOpen={isSharingModalOpen}
        onClose={() => setIsSharingModalOpen(false)}
        task={sharingTask}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
};

export default Dashboard;