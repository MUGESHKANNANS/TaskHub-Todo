
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Share, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/components/TaskCard';

interface TaskShare {
  id: string;
  shared_with_user_id: string;
  permission: 'view' | 'edit';
  profiles: {
    email: string;
    full_name: string | null;
  };
}

interface TaskSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdate: (task: Task) => void;
}

export const TaskSharingModal: React.FC<TaskSharingModalProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdate
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [taskShares, setTaskShares] = useState<TaskShare[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  // Fetch existing shares when modal opens
  useEffect(() => {
    if (isOpen && task) {
      fetchTaskShares();
    }
  }, [isOpen, task]);

  const fetchTaskShares = async () => {
    if (!task) return;
    
    setLoadingShares(true);
    try {
      const { data, error } = await supabase
        .from('task_shares')
        .select(`
          id,
          shared_with_user_id,
          permission,
          profiles!shared_with_user_id (
            email,
            full_name
          )
        `)
        .eq('task_id', task.id);

      if (error) throw error;
      
      // Type cast to ensure proper typing
      const typedData = (data || []).map(item => ({
        id: item.id,
        shared_with_user_id: item.shared_with_user_id,
        permission: item.permission as 'view' | 'edit',
        profiles: item.profiles as { email: string; full_name: string | null }
      }));
      
      setTaskShares(typedData);
    } catch (error: any) {
      console.error('Error fetching task shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sharing information',
        variant: 'destructive'
      });
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShareTask = async () => {
    if (!task || !email.trim()) return;

    const emailToShare = email.trim().toLowerCase();
    setLoading(true);
    
    try {
      // First check if user exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', emailToShare)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        throw new Error('Failed to lookup user');
      }

      if (!profileData) {
        toast({
          title: 'User not found',
          description: 'Please ensure the email address is correct and the user has signed up.',
          variant: 'destructive'
        });
        return;
      }

      // Check if already shared
      const existingShare = taskShares.find(share => 
        share.profiles.email === emailToShare
      );

      if (existingShare) {
        toast({
          title: 'Already shared',
          description: 'This task is already shared with this user.',
          variant: 'destructive'
        });
        return;
      }

      // Create new task share
      const { error: shareError } = await supabase
        .from('task_shares')
        .insert({
          task_id: task.id,
          shared_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          shared_with_user_id: profileData.id,
          permission: permission
        });

      if (shareError) {
        console.error('Share error:', shareError);
        throw shareError;
      }

      toast({
        title: 'Task shared successfully',
        description: `Task "${task.title}" has been shared with ${emailToShare} with ${permission} permission.`
      });

      setEmail('');
      setPermission('view');
      fetchTaskShares(); // Refresh the shares list
    } catch (error: any) {
      console.error('Error sharing task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to share task. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('task_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Access removed',
        description: `Removed access for ${userEmail}.`
      });

      fetchTaskShares(); // Refresh the shares list
    } catch (error: any) {
      console.error('Error removing share:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove access.',
        variant: 'destructive'
      });
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const isValidEmail = email.trim() && validateEmail(email.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Task
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              {task?.title}
            </h3>
            <p className="text-sm text-gray-600">
              Share this task with other users by entering their email address. Choose the appropriate permission level.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter user's email"
                value={email}
                onChange={handleEmailChange}
                onKeyPress={(e) => e.key === 'Enter' && isValidEmail && handleShareTask()}
                className={!isValidEmail && email.trim() ? 'border-red-300' : ''}
              />
              {email.trim() && !isValidEmail && (
                <p className="text-sm text-red-600">Please enter a valid email address</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission</Label>
              <Select value={permission} onValueChange={(value: 'view' | 'edit') => setPermission(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">View & Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleShareTask} 
              disabled={loading || !isValidEmail}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Sharing...' : 'Share Task'}
            </Button>
          </div>

          {loadingShares ? (
            <p className="text-sm text-gray-500">Loading shares...</p>
          ) : taskShares.length > 0 ? (
            <div className="space-y-2">
              <Label>Currently shared with:</Label>
              <div className="space-y-2">
                {taskShares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{share.profiles.email}</span>
                      {share.profiles.full_name && (
                        <span className="text-xs text-gray-500">{share.profiles.full_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={share.permission === 'edit' ? 'default' : 'secondary'}>
                        {share.permission === 'edit' ? 'Can Edit' : 'View Only'}
                      </Badge>
                      <button
                        onClick={() => handleRemoveShare(share.id, share.profiles.email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">This task is not shared with anyone yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
