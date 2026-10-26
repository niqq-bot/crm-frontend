import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { contactsApi } from '@/api/contacts';
import { getErrorMessage } from '@/api/client';
import { Contact } from '@/types/api';
import { formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableContainer, TableHead, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ContactFormModal } from './ContactFormModal';
import { ContactDetailModal } from './ContactDetailModal';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Building,
  Upload,
  Download,
  ArrowRight,
  MapPin,
} from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(() => searchParams.get('action') === 'new');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedContact(null);
    if (searchParams.get('action') === 'new') {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  // Queries
  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsApi.getByOwner,
  });

  // Export CSV handler
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await contactsApi.exportContacts();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contacts-export-${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Contacts exported successfully');
    } catch (err) {
      toast.error(`Export failed: ${getErrorMessage(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Import CSV handler
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await contactsApi.importContacts(file);
      toast.success('Contacts CSV imported successfully!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      refetch();
    } catch (err) {
      toast.error(`Import failed: ${getErrorMessage(err)}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const dept = (c.department || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      const term = search.toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        email.includes(term) ||
        dept.includes(term) ||
        title.includes(term);

      const matchesDept = departmentFilter === 'ALL' || c.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [contacts, search, departmentFilter]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    return Array.from(set);
  }, [contacts]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Contacts Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your network of verified business contacts, decision-makers, and clients
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".csv"
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isImporting}
            className="gap-1.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </Button>

          {/* CSV Export */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            isLoading={isExporting}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Contact</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-subtle">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search contacts by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-8 text-xs"
          />
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-8 text-xs py-0 w-36"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-primary" />}
          title={search ? 'No matching contacts' : 'No contacts in directory'}
          description={
            search
              ? 'Try modifying your search filter criteria'
              : 'Add contacts manually or import them via CSV to start tracking communication records.'
          }
          actionLabel="Create Contact"
          onAction={() => setIsFormOpen(true)}
        />
      ) : (
        <TableContainer>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Title & Department</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {filteredContacts.map((contact) => {
              return (
                <TableRow
                  key={contact.id}
                  clickable
                  onClick={() => setDetailContact(contact)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${getAvatarColor(
                          contact.email || contact.name
                        )}`}
                      >
                        {getInitials(contact.name, contact.email)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                          {contact.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {contact.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground text-xs truncate">
                        {contact.title || '—'}
                      </div>
                      {contact.department && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {contact.department}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-foreground font-medium">
                      {contact.phoneNumber || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {contact.contactSource || contact.ContactSource || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
                      {[contact.city, contact.country].filter(Boolean).join(', ') || '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(contact.createdAt)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailContact(contact)}
                      className="text-xs h-7 px-2"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </TableContainer>
      )}

      {/* Modals */}
      <ContactFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        contact={selectedContact}
        onSuccess={() => refetch()}
      />

      <ContactDetailModal
        isOpen={Boolean(detailContact)}
        onClose={() => setDetailContact(null)}
        contact={detailContact}
        onEdit={(c) => {
          setSelectedContact(c);
          setIsFormOpen(true);
        }}
        onRefresh={() => refetch()}
      />
    </div>
  );
};
