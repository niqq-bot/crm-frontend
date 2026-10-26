import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dealsApi } from '@/api/deals';
import { contactsApi } from '@/api/contacts';
import { usersApi } from '@/api/users';
import { getErrorMessage } from '@/api/client';
import {
  CreateDealDto,
  DealDto,
  DealStage,
  DealType,
  LeadSource,
  UpdateDealDto,
} from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EntitySelect, EntityOption } from '@/components/ui/EntitySelect';
import { toast } from 'sonner';
import { DEAL_STAGES, DEAL_TYPES, LEAD_SOURCES } from '@/lib/constants';

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: DealDto | null;
  initialStage?: DealStage;
  onSuccess: () => void;
}

export const DealFormModal: React.FC<DealFormModalProps> = ({
  isOpen,
  onClose,
  deal,
  initialStage,
  onSuccess,
}) => {
  const isEditing = Boolean(deal);

  const [dealName, setDealName] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [stage, setStage] = useState<DealStage>('QUALIFICATION');
  const [type, setType] = useState<DealType>('NEW_BUSINESS');
  const [probability, setProbability] = useState('50');
  const [nextStep, setNextStep] = useState('');
  const [leadSource, setLeadSource] = useState<LeadSource>('WEBSITE');
  const [campaignSource, setCampaignSource] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [contactId, setContactId] = useState<string | undefined>(undefined);
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load contacts for searchable human-readable contact selector
  const { data: contactsData = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts-for-select'],
    queryFn: contactsApi.getByOwner,
    enabled: isOpen,
  });

  const contactOptions: EntityOption[] = contactsData.map((c) => ({
    id: c.id,
    label: c.name,
    subLabel: c.email || c.title || undefined,
  }));

  // Load users for searchable human-readable owner selector
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-for-select'],
    queryFn: () => usersApi.getUsers({ size: 100 }),
    enabled: isOpen,
  });

  const userOptions: EntityOption[] = (usersData?.content || []).map((u) => ({
    id: u.id,
    label: `${u.firstName} ${u.lastName}`.trim() || u.email,
    subLabel: u.email,
  }));

  useEffect(() => {
    if (deal) {
      setDealName(deal.dealName || '');
      setAmount(deal.amount !== undefined ? String(deal.amount) : '');
      setExpectedRevenue(deal.expectedRevenue !== undefined ? String(deal.expectedRevenue) : '');
      setStage(deal.stage || 'QUALIFICATION');
      setType(deal.type || 'NEW_BUSINESS');
      setProbability(deal.probability !== undefined ? String(deal.probability) : '50');
      setNextStep(deal.nextStep || '');
      setLeadSource(deal.leadSource || 'WEBSITE');
      setCampaignSource(deal.campaignSource || '');
      setClosingDate(deal.closingDate || '');
      setContactId(deal.contactId);
      setOwnerId(deal.ownerId);
      setDescription(deal.description || '');
    } else {
      setDealName('');
      setAmount('');
      setExpectedRevenue('');
      setStage(initialStage || 'QUALIFICATION');
      setType('NEW_BUSINESS');
      setProbability('50');
      setNextStep('');
      setLeadSource('WEBSITE');
      setCampaignSource('');
      setClosingDate('');
      setContactId(undefined);
      setOwnerId(undefined);
      setDescription('');
    }
  }, [deal, initialStage, isOpen]);

  // Auto calculate expected revenue when amount or probability changes
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    const prob = parseInt(probability, 10);
    if (!isNaN(num) && !isNaN(prob)) {
      setExpectedRevenue(String(Math.round((num * prob) / 100)));
    }
  };

  const handleProbChange = (val: string) => {
    setProbability(val);
    const num = parseFloat(amount);
    const prob = parseInt(val, 10);
    if (!isNaN(num) && !isNaN(prob)) {
      setExpectedRevenue(String(Math.round((num * prob) / 100)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) {
      toast.error('Deal Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedAmount = amount ? parseFloat(amount) : undefined;
      const parsedExpected = expectedRevenue ? parseFloat(expectedRevenue) : undefined;
      const parsedProb = probability ? parseInt(probability, 10) : undefined;

      if (isEditing && deal) {
        const updatePayload: UpdateDealDto = {
          dealName: dealName.trim(),
          amount: parsedAmount,
          expectedRevenue: parsedExpected,
          stage,
          type,
          probability: parsedProb,
          nextStep: nextStep.trim() || undefined,
          leadSource,
          campaignSource: campaignSource.trim() || undefined,
          closingDate: closingDate || undefined,
          description: description.trim() || undefined,
          contactId: contactId || undefined,
          ownerId: ownerId || undefined,
        };
        await dealsApi.updateDeal(deal.id, updatePayload);
        toast.success('Deal updated successfully');
      } else {
        const createPayload: CreateDealDto = {
          dealName: dealName.trim(),
          amount: parsedAmount,
          expectedRevenue: parsedExpected,
          stage,
          type,
          probability: parsedProb,
          nextStep: nextStep.trim() || undefined,
          leadSource,
          campaignSource: campaignSource.trim() || undefined,
          closingDate: closingDate || undefined,
          description: description.trim() || undefined,
          contactId: contactId || undefined,
        };
        await dealsApi.createDeal(createPayload);
        toast.success('Deal created successfully');
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
      title={isEditing ? 'Edit Deal' : 'Create New Deal'}
      description={
        isEditing
          ? 'Update deal stage, value, and customer relationship information'
          : 'Track a new high-value sales opportunity on the board'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deal Name"
          value={dealName}
          onChange={(e) => setDealName(e.target.value)}
          placeholder="Enterprise Subscription — 500 Seats"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Deal Amount ($)"
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="50000"
          />

          <Input
            label="Probability (%)"
            type="number"
            min="0"
            max="100"
            value={probability}
            onChange={(e) => handleProbChange(e.target.value)}
            placeholder="50"
          />

          <Input
            label="Expected Revenue ($)"
            type="number"
            value={expectedRevenue}
            onChange={(e) => setExpectedRevenue(e.target.value)}
            placeholder="25000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Deal Stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as DealStage)}
          >
            {DEAL_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>

          <Select
            label="Deal Type"
            value={type}
            onChange={(e) => setType(e.target.value as DealType)}
          >
            {DEAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Searchable human-readable contact selector */}
          <EntitySelect
            label="Associated Contact"
            value={contactId}
            onChange={setContactId}
            options={contactOptions}
            isLoading={isLoadingContacts}
            placeholder="Select contact..."
            searchPlaceholder="Search contact by name or email..."
          />

          {/* Searchable human-readable owner selector */}
          <EntitySelect
            label="Deal Owner"
            value={ownerId}
            onChange={setOwnerId}
            options={userOptions}
            isLoading={isLoadingUsers}
            placeholder="Assign owner..."
            searchPlaceholder="Search team members..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Target Closing Date"
            type="date"
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
          />

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

          <Input
            label="Campaign Source"
            value={campaignSource}
            onChange={(e) => setCampaignSource(e.target.value)}
            placeholder="Q1 Google Ad / Webinar"
          />
        </div>

        <Input
          label="Next Step"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          placeholder="Schedule technical architecture review"
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-foreground/80 tracking-tight">
            Description / Opportunity Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            placeholder="Executive sponsor, procurement process..."
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
