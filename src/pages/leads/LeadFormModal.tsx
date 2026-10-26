import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/api/leads';
import { usersApi } from '@/api/users';
import { getErrorMessage } from '@/api/client';
import {
  CreateLeadRequest,
  Industry,
  Lead,
  LeadRating,
  LeadSource,
  LeadStatus,
  UpdateLeadRequest,
} from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EntitySelect, EntityOption } from '@/components/ui/EntitySelect';
import { toast } from 'sonner';
import { INDUSTRIES, LEAD_SOURCES } from '@/lib/constants';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const isEditing = Boolean(lead);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [industry, setIndustry] = useState<Industry>('SOFTWARE');
  const [leadSource, setLeadSource] = useState<LeadSource>('WEBSITE');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('NEW');
  const [rating, setRating] = useState<LeadRating>('WARM');
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users for human-readable owner selection
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-list-for-select'],
    queryFn: () => usersApi.getUsers({ size: 100 }),
    enabled: isOpen,
  });

  const userOptions: EntityOption[] = (usersData?.content || []).map((u) => ({
    id: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
    subLabel: u.email,
  }));

  useEffect(() => {
    if (lead) {
      setFirstName(lead.firstName || '');
      setLastName(lead.lastName || '');
      setCompany(lead.company || '');
      setTitle(lead.title || '');
      setEmail(lead.email || '');
      setSecondaryEmail(lead.secondaryEmail || '');
      setPhone(lead.phone || '');
      setMobile(lead.mobile || '');
      setAnnualRevenue(lead.annualRevenue !== undefined ? String(lead.annualRevenue) : '');
      setEmployeeCount(lead.employeeCount !== undefined ? String(lead.employeeCount) : '');
      setIndustry(lead.industry || 'SOFTWARE');
      setLeadSource(lead.leadSource || 'WEBSITE');
      setLeadStatus(lead.leadStatus || 'NEW');
      setRating(lead.rating || 'WARM');
      setOwnerId(lead.ownerId || (lead.owner ? lead.owner.id : undefined));
      setDescription(lead.description || '');
      setCity(lead.city || '');
      setCountry(lead.country || '');
    } else {
      setFirstName('');
      setLastName('');
      setCompany('');
      setTitle('');
      setEmail('');
      setSecondaryEmail('');
      setPhone('');
      setMobile('');
      setAnnualRevenue('');
      setEmployeeCount('');
      setIndustry('SOFTWARE');
      setLeadSource('WEBSITE');
      setLeadStatus('NEW');
      setRating('WARM');
      setOwnerId(undefined);
      setDescription('');
      setCity('');
      setCountry('');
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim() && !company.trim()) {
      toast.error('Please provide at least a name or company');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLeadRequest = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        email: email.trim() || undefined,
        secondaryEmail: secondaryEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        employeeCount: employeeCount ? parseInt(employeeCount, 10) : undefined,
        industry,
        leadSource,
        leadStatus,
        rating,
        description: description.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      };

      if (isEditing && lead) {
        const updatePayload: UpdateLeadRequest = {
          ...payload,
          leadId: lead.id || lead.leadId || '',
          ownerId: ownerId || undefined,
        };
        await leadsApi.updateLead(updatePayload);
        toast.success('Lead updated successfully');
      } else {
        await leadsApi.createLead(payload);
        toast.success('Lead created successfully');
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Lead' : 'Create New Lead'}
      description={
        isEditing
          ? 'Update lead contact information and profile attributes'
          : 'Capture a new prospective client or business lead'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
          />
          <Input
            label="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VP of Operations"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Lead Status"
            value={leadStatus}
            onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </Select>

          <Select
            label="Lead Source"
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value as LeadSource)}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>

          <Select
            label="Rating"
            value={rating}
            onChange={(e) => setRating(e.target.value as LeadRating)}
          >
            <option value="HOT">Hot 🔥</option>
            <option value="WARM">Warm ⚡</option>
            <option value="COLD">Cold ❄️</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value as Industry)}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </Select>

          {/* Searchable human-readable owner select */}
          <EntitySelect
            label="Lead Owner"
            value={ownerId}
            onChange={setOwnerId}
            options={userOptions}
            isLoading={isLoadingUsers}
            placeholder="Assign to team member..."
            searchPlaceholder="Search members by name or email..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Annual Revenue ($)"
            type="number"
            value={annualRevenue}
            onChange={(e) => setAnnualRevenue(e.target.value)}
            placeholder="1000000"
          />
          <Input
            label="Employee Count"
            type="number"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            placeholder="50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="San Francisco"
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="United States"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-foreground/80 tracking-tight">
            Description / Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            placeholder="Key discussion points, lead requirements..."
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
