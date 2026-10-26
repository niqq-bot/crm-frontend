import {
  DealStage,
  DealType,
  LeadRating,
  LeadSource,
  LeadStatus,
  Industry,
  RoleType,
  TaskPriority,
  TaskStatus,
  ActionType,
} from '@/types/api';

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  NEW: {
    label: 'New',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
  },
  CONTACTED: {
    label: 'Contacted',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
  },
  QUALIFIED: {
    label: 'Qualified',
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-900',
  },
  CONVERTED: {
    label: 'Converted',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  LOST: {
    label: 'Lost',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
};

export const LEAD_RATING_CONFIG: Record<
  LeadRating,
  { label: string; color: string; bg: string; dot: string }
> = {
  HOT: {
    label: 'Hot',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    dot: 'bg-rose-500',
  },
  WARM: {
    label: 'Warm',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
  },
  COLD: {
    label: 'Cold',
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    dot: 'bg-sky-400',
  },
};

export const DEAL_STAGES: { id: DealStage; label: string; color: string; barColor: string }[] = [
  { id: 'QUALIFICATION', label: 'Qualification', color: 'text-blue-600 dark:text-blue-400', barColor: 'bg-blue-500' },
  { id: 'NEEDS_ANALYSIS', label: 'Needs Analysis', color: 'text-cyan-600 dark:text-cyan-400', barColor: 'bg-cyan-500' },
  { id: 'VALUE_PROPOSITION', label: 'Value Proposition', color: 'text-indigo-600 dark:text-indigo-400', barColor: 'bg-indigo-500' },
  { id: 'IDENTIFY_DECISION_MAKERS', label: 'Decision Makers', color: 'text-purple-600 dark:text-purple-400', barColor: 'bg-purple-500' },
  { id: 'PROPOSAL_PRICE_QUOTE', label: 'Proposal / Quote', color: 'text-amber-600 dark:text-amber-400', barColor: 'bg-amber-500' },
  { id: 'NEGOTIATION_REVIEW', label: 'Negotiation', color: 'text-orange-600 dark:text-orange-400', barColor: 'bg-orange-500' },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'text-emerald-600 dark:text-emerald-400', barColor: 'bg-emerald-500' },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'text-rose-600 dark:text-rose-400', barColor: 'bg-rose-500' },
];

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  NOT_STARTED: {
    label: 'Not Started',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
  },
  WAITING_FOR_INPUT: {
    label: 'Waiting for Input',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  DEFERRED: {
    label: 'Deferred',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
  },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string }
> = {
  LOWEST: {
    label: 'Lowest',
    color: 'text-zinc-500 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    dot: 'bg-zinc-400',
  },
  LOW: {
    label: 'Low',
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    dot: 'bg-sky-400',
  },
  NORMAL: {
    label: 'Normal',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    dot: 'bg-blue-500',
  },
  HIGH: {
    label: 'High',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
  },
  HIGHEST: {
    label: 'Highest',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    dot: 'bg-rose-500',
  },
};

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'EVENT', label: 'Event' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'ORGANIC_SEARCH', label: 'Organic Search' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'OTHER', label: 'Other' },
];

export const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'SOFTWARE', label: 'Software / Technology' },
  { value: 'FINANCE', label: 'Finance & Banking' },
  { value: 'HEALTHCARE', label: 'Healthcare & Life Sciences' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RETAIL', label: 'Retail & E-commerce' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'OTHER', label: 'Other' },
];

export const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: 'NEW_BUSINESS', label: 'New Business' },
  { value: 'EXISTING_BUSINESS', label: 'Existing Business' },
  { value: 'RENEWAL', label: 'Renewal' },
  { value: 'UPSELL', label: 'Upsell' },
  { value: 'CROSS_SELL', label: 'Cross-sell' },
];

export const ROLE_CONFIG: Record<
  RoleType,
  { label: string; badge: string }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  ORG_ADMIN: {
    label: 'Organization Admin',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  MEMBER: {
    label: 'Member',
    badge: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  },
};

export const ACTION_TYPE_CONFIG: Record<
  ActionType,
  { label: string; icon: string; color: string }
> = {
  CREATE: { label: 'Created', icon: 'Plus', color: 'text-emerald-500' },
  UPDATE: { label: 'Updated', icon: 'Edit3', color: 'text-blue-500' },
  DELETE: { label: 'Deleted', icon: 'Trash2', color: 'text-rose-500' },
  LOGIN: { label: 'Logged In', icon: 'LogIn', color: 'text-cyan-500' },
  LOGOUT: { label: 'Logged Out', icon: 'LogOut', color: 'text-zinc-500' },
  PASSWORD_RESET: { label: 'Password Reset', icon: 'Key', color: 'text-amber-500' },
  EMAIL_VERIFIED: { label: 'Email Verified', icon: 'CheckCircle', color: 'text-emerald-500' },
  ROLE_ASSIGNED: { label: 'Role Assigned', icon: 'Shield', color: 'text-purple-500' },
  ROLE_REMOVED: { label: 'Role Removed', icon: 'ShieldOff', color: 'text-orange-500' },
  CONVERT: { label: 'Converted', icon: 'ArrowRightCircle', color: 'text-violet-500' },
};
