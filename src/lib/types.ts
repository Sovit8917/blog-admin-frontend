export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';

export type PostStatus = 'DRAFT' | 'IN_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type CommentStatus = 'PENDING' | 'APPROVED' | 'SPAM' | 'REJECTED';

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  name?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  order: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  _count?: { posts: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: { posts: number };
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  status: PostStatus;
  postType: PostType;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  isFeatured: boolean;
  isSponsored: boolean;
  readingTimeMins: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  authorId: string;
  categoryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; username: string; avatarUrl?: string | null };
  category?: Category | null;
  tags?: { tag: Tag }[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; username: string; avatarUrl?: string | null };
  post?: { id: string; title: string; slug: string };
}

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  name: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  _count?: { posts: number; comments?: number; postedJobs?: number };
}

export interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  bucket: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER';
  altText?: string | null;
  uploadedById: string;
  createdAt: string;
}

export interface Setting {
  id?: string;
  key: string;
  value: string;
  group: string;
  updatedAt?: string;
}

export type EmployerRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface EmployerRequest {
  id: string;
  userId: string;
  companyName: string;
  message?: string | null;
  status: EmployerRequestStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; username: string; name: string; email?: string; avatarUrl?: string | null };
  reviewedBy?: { id: string; name: string; username: string } | null;
}

export type PostType =
  | 'ARTICLE'
  | 'CAREER_ADVICE'
  | 'INTERVIEW_PREP'
  | 'RESUME_TIPS'
  | 'SALARY_GUIDE'
  | 'TUTORIAL'
  | 'NEWS';

export const CAREER_CONTENT_TYPES: PostType[] = [
  'CAREER_ADVICE',
  'INTERVIEW_PREP',
  'RESUME_TIPS',
  'SALARY_GUIDE',
];

export type ResourceType =
  | 'DOCUMENTATION'
  | 'TOOL'
  | 'LIBRARY'
  | 'COURSE'
  | 'TUTORIAL'
  | 'BOOK'
  | 'COMMUNITY'
  | 'OTHER';

export interface DeveloperResource {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  resourceType: ResourceType;
  tags: string[];
  iconUrl?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  posts: {
    total: number;
    published: number;
    draft: number;
    byType: { postType: PostType; _count: number }[];
  };
  users: { total: number; new7d: number };
  comments: { total: number; pending: number };
  newsletter: { confirmedSubscribers: number };
  monetization: { activeAds: number; activeSponsors: number };
  jobs: { total: number; open: number; applications: number; closingSoon: { count: number; items: JobClosingSoon[] } };
  developerResources: {
    total: number;
    active: number;
    featured: number;
    byType: { resourceType: ResourceType; _count: number }[];
  };
  mostRead: MostReadEntry[];
  pendingEmployerRequests: number;
  recentPosts: { id: string; title: string; slug: string; status: PostStatus; postType: PostType; updatedAt: string }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: { username: string; name: string } | null;
  }[];
}

export interface JobClosingSoon {
  id: string;
  title: string;
  slug: string;
  expiresAt: string;
  company?: { name: string; slug: string } | null;
}

export interface MostReadEntry {
  post: { id: string; title: string; slug: string; postType: PostType; viewCount: number; likeCount: number; commentCount: number };
  periodViews: number;
  periodUniqueViews: number | null;
}

export interface RecommendationStats {
  totalImpressions: number;
  totalClicks: number;
  overallCtr: number;
  bySource: { source: string; impressions: number; clicks: number; ctr: number }[];
  topClickedPosts: { post: { id: string; title: string; slug: string; postType: PostType }; clicks: number }[];
}

export interface PaginatedOffset<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// ---------------------------------------------------------------------------
// Phase 2: Job board, monetization, growth & system modules
// ---------------------------------------------------------------------------

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type ExperienceLevel = 'INTERNSHIP' | 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL' | 'LEAD' | 'EXECUTIVE';
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'EXPIRED';
export type ApplicationStatus = 'SUBMITTED' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
export type AdPlacement = 'HEADER' | 'SIDEBAR' | 'IN_CONTENT' | 'FOOTER' | 'BETWEEN_POSTS' | 'POPUP';
export type SponsorTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTNER';
export type SubscriberStatus = 'PENDING' | 'CONFIRMED' | 'UNSUBSCRIBED' | 'BOUNCED';
export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'POST_VIEW'
  | 'AD_IMPRESSION'
  | 'AD_CLICK'
  | 'AFFILIATE_CLICK'
  | 'NEWSLETTER_SIGNUP'
  | 'SEARCH'
  | 'SHARE';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  location?: string | null;
  isVerified: boolean;
  createdById: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { jobs: number };
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: { jobs: number };
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  companyId: string;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  location?: string | null;
  remoteType: RemoteType;
  employmentType: EmploymentType;
  experienceLevel?: ExperienceLevel | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  applyUrl?: string | null;
  allowInternalApply: boolean;
  status: JobStatus;
  postedById: string;
  viewCount: number;
  applicationCount: number;
  isFeatured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string; slug: string; logoUrl?: string | null; isVerified: boolean };
  postedBy?: { id: string; username: string; name: string };
  skills?: { skill: Skill }[];
  _count?: { applications: number; savedBy: number };
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; username: string; name: string; email: string; avatarUrl?: string | null };
  job?: { id: string; title: string; slug: string; status: JobStatus; company?: { name: string; slug: string; logoUrl?: string | null } };
}

export interface Advertisement {
  id: string;
  title: string;
  placement: AdPlacement;
  imageUrl: string;
  targetUrl: string;
  advertiser?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateLink {
  id: string;
  title: string;
  originalUrl: string;
  slug: string;
  postId?: string | null;
  program?: string | null;
  isActive: boolean;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  tier: SponsorTier;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  source?: string | null;
  subscribedAt: string;
  confirmedAt?: string | null;
  unsubscribedAt?: string | null;
}

export interface NewsletterStats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
}

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: { id: string; username: string; name: string } | null;
}

export interface AnalyticsOverview {
  totalViews: number;
  totalPosts: number;
  totalUsers: number;
  totalSubscribers: number;
  eventsByType: { type: AnalyticsEventType; _count: number }[];
  topPosts: { id: string; title: string; slug: string; viewCount: number; likeCount: number }[];
  pendingInBuffer: number;
}
