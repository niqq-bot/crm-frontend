import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { contactsApi } from '@/api/contacts';
import { activityTimelineApi } from '@/api/activityTimeline';
import { getErrorMessage } from '@/api/client';
import { Contact } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Building,
  User,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Briefcase,
  FileText,
} from 'lucide-react';
import { formatDate, getInitials, getAvatarColor } from '@/lib/utils';

interface ContactDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onRefresh: () => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  isOpen,
  onClose,
  contact,
  onEdit,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['contact-timeline', contact?.id],
    queryFn: () => activityTimelineApi.getTimeline('CONTACT', contact!.id),
    enabled: isOpen && Boolean(contact?.id),
  });

  if (!contact) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await contactsApi.deleteContact(contact.id);
      toast.success('Contact deleted');
      setIsDeleteOpen(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(
                contact.email || contact.name
              )}`}
            >
              {getInitials(contact.name, contact.email)}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {contact.name}
              </h2>
              {(contact.title || contact.department) && (
                <p className="text-xs text-muted-foreground">
                  {[contact.title, contact.department].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(contact)}
              className="gap-1.5 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDeleteOpen(true)}
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-border/80 gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'overview'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`pb-2.5 transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'activity'
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity Timeline
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Communications
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-foreground select-all">{contact.email}</span>
                  </div>
                  {contact.secondaryEmail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="text-foreground">{contact.secondaryEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-foreground">{contact.phoneNumber || '—'}</span>
                  </div>
                  {(contact.city || contact.state || contact.country) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-foreground">
                        {[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                  Context & Organization
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium text-foreground">
                      {contact.contactSource || contact.ContactSource || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-border/40">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium text-foreground">
                      {contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : 'Assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-muted-foreground">Added On</span>
                    <span className="text-muted-foreground">{formatDate(contact.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {contact.description && (
              <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-1">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </h4>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {contact.description}
                </p>
              </div>
            )}

            {contact.note && (
              <div className="rounded-xl border border-border/60 p-4 bg-amber-500/5 space-y-1">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Internal Notes
                </h4>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {contact.note}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="py-2">
            <ActivityFeed
              activities={timelineData || []}
              isLoading={isLoadingTimeline}
              emptyMessage="No activity events recorded for this contact yet"
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        description={`Are you sure you want to delete ${contact.name}? This record will be permanently deleted.`}
        confirmLabel="Delete Contact"
        isLoading={isDeleting}
      />
    </>
  );
};
