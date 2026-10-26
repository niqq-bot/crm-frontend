import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { getErrorMessage } from '@/api/client';
import { UserResponse } from '@/types/api';
import { formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableContainer, TableHead, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Lock,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');

  // Editing state
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Queries
  const { data: pageData, isLoading, refetch } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => usersApi.getUsers({ page, size: pageSize }),
  });

  const users = pageData?.content || [];

  // Activation mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        await usersApi.deactivateUser(id);
      } else {
        await usersApi.activateUser(id);
      }
    },
    onSuccess: (_, { isActive }) => {
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(`Status change failed: ${getErrorMessage(err)}`);
    },
  });

  const handleOpenEdit = (user: UserResponse) => {
    setEditUser(user);
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditPhone(user.phoneNumber || '');
    setEditJobTitle(user.jobTitle || '');
    setEditDepartment(user.department || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setIsUpdating(true);
    try {
      await usersApi.updateUser(editUser.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phoneNumber: editPhone.trim() || undefined,
        jobTitle: editJobTitle.trim() || undefined,
        department: editDepartment.trim() || undefined,
      });
      toast.success('User updated successfully');
      setEditUser(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const term = search.toLowerCase();
    return !term || name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Team Members & Users
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage organization members, security statuses, and departmental assignments
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-primary" />}
          title="No users found"
          description="Send invitations from the Invitations tab to add colleagues to your organization."
        />
      ) : (
        <TableContainer>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Team Member</TableHeaderCell>
              <TableHeaderCell>Role & Title</TableHeaderCell>
              <TableHeaderCell>Department</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Account Status</TableHeaderCell>
              <TableHeaderCell>Joined Date</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {filteredUsers.map((user) => {
              const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
              const isActive = user.isActive !== false;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${getAvatarColor(
                          user.email || fullName
                        )}`}
                      >
                        {getInitials(fullName, user.email)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-foreground truncate">
                          {fullName}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-foreground">
                        {user.jobTitle || 'Team Member'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Shield className="w-3 h-3 text-primary" />
                        <span>Member</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-foreground font-medium">
                      {user.department || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {user.phoneNumber || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    {isActive ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(user)}
                        className="h-7 px-2 text-xs"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant={isActive ? 'outline' : 'secondary'}
                        onClick={() =>
                          toggleStatusMutation.mutate({ id: user.id, isActive })
                        }
                        isLoading={
                          toggleStatusMutation.isPending &&
                          toggleStatusMutation.variables?.id === user.id
                        }
                        className={`h-7 px-2 text-xs font-medium ${
                          isActive
                            ? 'text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </TableContainer>
      )}

      {/* Pagination Bar */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {pageData.totalPages} ({pageData.totalElements} users)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 px-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pageData.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit User Modal (No password exposure!) */}
      <Modal
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title="Edit Team Member"
        description="Update contact information and departmental title"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Phone Number"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Job Title"
              value={editJobTitle}
              onChange={(e) => setEditJobTitle(e.target.value)}
              placeholder="Account Executive"
            />
            <Input
              label="Department"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              placeholder="Sales"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isUpdating}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
