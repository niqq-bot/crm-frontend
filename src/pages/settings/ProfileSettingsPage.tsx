import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { User, Mail, Phone, Briefcase, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';

export const ProfileSettingsPage: React.FC = () => {
  const { user, organizationName, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phoneNumber || '');
      setJobTitle(user.jobTitle || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await usersApi.updateUser(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
      });

      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Profile Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal account details, team credentials, and contact preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${getAvatarColor(
                user?.email || user?.firstName
              )}`}
            >
              {getInitials(
                user ? `${user.firstName} ${user.lastName}` : null,
                user?.email
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {user ? `${user.firstName} ${user.lastName}` : 'User Profile'}
                </h2>
                {user?.emailVerified && (
                  <Badge variant="success" className="gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
                {organizationName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {organizationName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed directly."
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Account Executive"
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enterprise Sales"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border/60">
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
