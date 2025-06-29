import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    created_at: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || '',
        email: data.email || user?.email || '',
        avatar_url: data.avatar_url || '',
        created_at: data.created_at || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Link to="/" className="w-fit">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account information</p>
          </div>
        </div>

        <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex-1 sm:flex-none"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            fetchProfile();
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-4">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg sm:text-xl lg:text-2xl">
                      {profile.full_name 
                        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : profile.email?.charAt(0).toUpperCase() || 'U'
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  {!isEditing && (
                    <div className="text-center">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {profile.full_name || 'No name set'}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 break-all">{profile.email}</p>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 min-h-[40px] flex items-center">
                        {profile.full_name || 'No name set'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700 min-h-[40px] flex items-center justify-between">
                      <span className="break-all">{profile.email}</span>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">(Cannot be changed)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 min-h-[40px] flex items-center">
                      {profile.email?.split('@')[0] || 'Not available'}
                    </div>
                  </div>

                  {profile.created_at && (
                    <div className="space-y-2">
                      <Label htmlFor="joined" className="text-sm font-medium">Joined Date</Label>
                      <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 min-h-[40px] flex items-center">
                        {format(new Date(profile.created_at), 'MMMM dd, yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Profile Completion</span>
                    <span className="text-sm font-medium text-blue-600">
                      {profile.full_name ? '100%' : '80%'}
                    </span>
                  </div>
                  
                  {profile.created_at && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-900">
                        {format(new Date(profile.created_at), 'MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>

                {!profile.full_name && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Complete your profile by adding your full name to get the most out of TaskFlow.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;