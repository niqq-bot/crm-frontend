import React, { useEffect, useState } from 'react';
import { contactsApi } from '@/api/contacts';
import { getErrorMessage } from '@/api/client';
import { Contact, CreateContactDto } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess: () => void;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSuccess,
}) => {
  const isEditing = Boolean(contact);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [contactSource, setContactSource] = useState('Website');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setEmail(contact.email || '');
      setSecondaryEmail(contact.secondaryEmail || '');
      setPhoneNumber(contact.phoneNumber || '');
      setTitle(contact.title || '');
      setDepartment(contact.department || '');
      setContactSource(contact.contactSource || contact.ContactSource || 'Website');
      setCountry(contact.country || '');
      setState(contact.state || '');
      setCity(contact.city || '');
      setDescription(contact.description || '');
      setNote(contact.note || '');
    } else {
      setName('');
      setEmail('');
      setSecondaryEmail('');
      setPhoneNumber('');
      setTitle('');
      setDepartment('');
      setContactSource('Website');
      setCountry('');
      setState('');
      setCity('');
      setDescription('');
      setNote('');
    }
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Contact name is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateContactDto = {
        name: name.trim(),
        email: email.trim(),
        secondaryEmail: secondaryEmail.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        title: title.trim() || undefined,
        department: department.trim() || undefined,
        contactSource,
        country: country.trim() || undefined,
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        description: description.trim() || undefined,
        note: note.trim() || undefined,
      };

      if (isEditing && contact) {
        await contactsApi.updateContact(contact.id, payload);
        toast.success('Contact updated successfully');
      } else {
        await contactsApi.createContact(payload);
        toast.success('Contact created successfully');
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
      title={isEditing ? 'Edit Contact' : 'Create New Contact'}
      description={
        isEditing
          ? 'Update contact communications profile and organizational data'
          : 'Add a new client or business contact to your organization'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rahul Sharma"
            required
          />

          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rahul@company.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <Input
            label="Secondary Email (optional)"
            type="email"
            value={secondaryEmail}
            onChange={(e) => setSecondaryEmail(e.target.value)}
            placeholder="secondary@company.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chief Technology Officer"
          />

          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Engineering"
          />

          <Select
            label="Contact Source"
            value={contactSource}
            onChange={(e) => setContactSource(e.target.value)}
          >
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Partner">Partner</option>
            <option value="Conference">Conference</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="San Francisco"
          />
          <Input
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="California"
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="United States"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/80 tracking-tight">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Background context..."
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/80 tracking-tight">
              Internal Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Internal reminders..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
