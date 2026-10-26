// TypeScript definitions aligned with Logic-Q1 CRM OpenAPI Specification

export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_INPUT'
  | 'COMPLETED'
  | 'DEFERRED';

export type TaskPriority =
  | 'LOWEST'
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'HIGHEST';

export type DealStage =
  | 'QUALIFICATION'
  | 'NEEDS_ANALYSIS'
  | 'VALUE_PROPOSITION'
  | 'IDENTIFY_DECISION_MAKERS'
  | 'PROPOSAL_PRICE_QUOTE'
  | 'NEGOTIATION_REVIEW'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type DealType =
  | 'NEW_BUSINESS'
  | 'EXISTING_BUSINESS'
  | 'RENEWAL'
  | 'UPSELL'
  | 'CROSS_SELL';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'LOST'
  | 'CONVERTED';

export type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'EMAIL_CAMPAIGN'
  | 'COLD_CALL'
  | 'EVENT'
  | 'GOOGLE_ADS'
  | 'ORGANIC_SEARCH'
  | 'PARTNER'
  | 'OTHER';

export type Industry =
  | 'SOFTWARE'
  | 'FINANCE'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'RETAIL'
  | 'MANUFACTURING'
  | 'OTHER';

export type LeadRating = 'HOT' | 'WARM' | 'COLD';

export type RoleType = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MEMBER';

export type ActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFIED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'CONVERT';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  jobTitle?: string;
  phoneNumber?: string;
  department?: string;
  onBoarded: boolean;
  emailVerified: boolean;
  orgId?: string | null;
  roleId?: string | null;
}

export interface AuthResponse {
  status: boolean;
  message?: string;
  token?: string;
  user?: UserData;
}

export interface Roles {
  id: string;
  organization?: any;
  role: RoleType;
  description?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  jobTitle?: string;
  department?: string;
  onBoarded?: boolean;
  isActive?: boolean;
  emailVerified?: boolean;
  authBy?: 'LOCAL' | 'GOOGLE';
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  organization?: Organization | null;
  role?: Roles;
  enabled?: boolean;
  username?: string;
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  jobTitle?: string;
  department?: string;
  onBoarded?: boolean;
  isActive?: boolean;
  emailVerified?: boolean;
  organizationId?: string | null;
  roleId?: string | null;
  createdById?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageableObject {
  offset?: number;
  paged?: boolean;
  pageNumber?: number;
  pageSize?: number;
  unpaged?: boolean;
}

export interface PageUserResponse {
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  content: UserResponse[];
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements?: number;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  adminId?: User;
  members?: User[];
  contacts?: Contact[];
  mobileNumber?: string;
  websiteUrl?: string;
  category?: string;
  country?: string;
  state?: string;
  city?: string;
  pinCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrganizationDto {
  name: string;
  category?: string;
  country?: string;
  websiteUrl?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  secondaryEmail?: string;
  phoneNumber?: string;
  description?: string;
  note?: string;
  owner?: User;
  organization?: Organization;
  department?: string;
  contactSource?: string;
  ContactSource?: string;
  title?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContactDto {
  name: string;
  email: string;
  phoneNumber?: string;
  secondaryEmail?: string;
  description?: string;
  note?: string;
  title?: string;
  department?: string;
  contactSource?: string;
  ContactSource?: string;
  country?: string;
  city?: string;
  state?: string;
}

export interface Lead {
  id: string;
  leadId?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  secondaryEmail?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  twitterHandle?: string;
  annualRevenue?: number;
  employeeCount?: number;
  emailOptOut?: boolean;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  industry?: Industry;
  leadStatus: LeadStatus;
  leadSource?: LeadSource;
  rating?: LeadRating;
  ownerId?: string;
  owner?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeadRequest {
  title?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  secondaryEmail?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  twitterHandle?: string;
  annualRevenue?: number;
  employeeCount?: number;
  emailOptOut?: boolean;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  industry?: Industry;
  leadStatus?: LeadStatus;
  leadSource?: LeadSource;
  rating?: LeadRating;
}

export interface UpdateLeadRequest extends CreateLeadRequest {
  leadId: string;
  ownerId?: string;
}

export interface DealDto {
  id: string;
  dealName: string;
  amount?: number;
  expectedRevenue?: number;
  stage: DealStage;
  type?: DealType;
  probability?: number;
  nextStep?: string;
  leadSource?: LeadSource;
  campaignSource?: string;
  closingDate?: string;
  description?: string;
  contactId?: string;
  ownerId?: string;
  ownerName?: string;
  organizationId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDealDto {
  dealName: string;
  amount?: number;
  expectedRevenue?: number;
  stage?: DealStage;
  type?: DealType;
  probability?: number;
  nextStep?: string;
  leadSource?: LeadSource;
  campaignSource?: string;
  closingDate?: string;
  description?: string;
  contactId?: string;
}

export interface UpdateDealDto {
  dealName?: string;
  amount?: number;
  expectedRevenue?: number;
  stage?: DealStage;
  type?: DealType;
  probability?: number;
  nextStep?: string;
  leadSource?: LeadSource;
  campaignSource?: string;
  closingDate?: string;
  description?: string;
  contactId?: string;
  ownerId?: string;
}

export interface TaskItem {
  id: string;
  subject: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  sendNotificationEmail?: boolean;
  recurringActivity?: boolean;
  ownerId?: string;
  owner?: User;
  relatedContactId?: string;
  relatedContact?: Contact;
  relatedLeadId?: string;
  relatedLead?: Lead;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskRequest {
  subject: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  sendNotificationEmail?: boolean;
  recurringActivity?: boolean;
  ownerId?: string;
  relatedContactId?: string;
  relatedLeadId?: string;
}

export interface UpdateTaskRequest {
  subject?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  sendNotificationEmail?: boolean;
  recurringActivity?: boolean;
  ownerId?: string;
  relatedContactId?: string;
  relatedLeadId?: string;
}

export interface MoveTaskRequest {
  status: TaskStatus;
  position?: number;
}

export interface CreateOrganizationInviteRequest {
  email: string;
  roleId: string;
}

export interface OrganizationInviteResponse {
  token: string;
}

export interface ValidateOrganizationInviteResponse {
  email: string;
  organizationName: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
}

export interface RegisterInviteRequest {
  token: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export interface FieldChange {
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  visibility?: 'ENTITY_FEED' | 'ORGANIZATION_FEED';
}

export interface ActivityTimeline {
  id: string;
  entityType: string;
  entityId: string;
  actionType: ActionType;
  changes?: FieldChange[];
  performedBy?: string;
  organizationId?: string;
  createdAt: string;
  visibility: 'ENTITY_FEED' | 'ORGANIZATION_FEED';
}

export interface PageActivityTimeline {
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  content: ActivityTimeline[];
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements?: number;
}

export interface MailBody {
  to: string;
  subject: string;
  text: string;
}
