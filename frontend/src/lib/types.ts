// Mirrors the DTOs in backend/CareerPath.Api/Dtos. Keep both sides in sync.

export type CompetencyLevel = 'Learning' | 'Comfortable' | 'Strong'
export type ListingStatus = 'Open' | 'Closed' | 'Completed' | 'Cancelled'
export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Completed' | 'Cancelled'
export type ApplicationOrigin = 'Applied' | 'Invited'
export type MatchReasonKind = 'Strength' | 'Gap'

export interface Competency {
  id: number
  slug: string
  name: string
  category: string
  icon: string
  description: string
}

export interface UserCompetency {
  slug: string
  name: string
  category: string
  icon: string
  level: CompetencyLevel
}

export interface GitHubProject {
  id?: number
  name: string
  description: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  url: string
  pushedAt: string | null
  isDisplayed?: boolean
  isPrivate?: boolean
}

export interface UserSummary {
  id: number
  displayName: string
  headline: string
  location: string | null
  university: string | null
  program: string | null
  studyYear: number | null
  skills: string[]
  competencies: UserCompetency[]
  openToJoin: boolean
  lookingForNote: string
  weeklyHours: number
  gitHubUsername: string | null
  projectCount: number
}

export interface ProfileStats {
  listings: number
  collaborations: number
  projects: number
  competencies: number
}

export interface Contact {
  email: string
  contactHandle: string | null
}

export interface UserProfile {
  user: UserSummary
  bio: string
  linkedInUrl: string | null
  portfolioUrl: string | null
  joinedAt: string
  gitHubSyncedAt: string | null
  projects: GitHubProject[]
  listings: Listing[]
  stats: ProfileStats
  isSelf: boolean
  contact: Contact | null
  allProjects?: GitHubProject[]
}

export interface CompetencyChoice {
  slug: string
  level: CompetencyLevel
}

export interface UpdateProfileRequest {
  displayName: string
  headline: string
  bio: string
  location: string
  university: string
  program: string
  studyYear: number | null
  skills: string[]
  competencies: CompetencyChoice[]
  weeklyHours: number
  openToJoin: boolean
  lookingForNote: string
  gitHubUsername: string
  linkedInUrl: string
  portfolioUrl: string
  contactHandle: string
  displayedProjects?: string[]
  displayedProjectIds?: number[]
}

export interface GitHubSyncResult {
  success: boolean
  error: string | null
  username: string | null
  importedCount: number
  syncedAt: string | null
  projects: GitHubProject[]
}

export interface Suggestion {
  user: UserSummary
  listingId: number
  listingTitle: string
  match: Match
}

export interface PlatformStats {
  members: number
  openListings: number
  competencies: number
  collaborations: number
  projects: number
}

export interface MatchReason {
  kind: MatchReasonKind
  title: string
  detail: string
}

export interface MatchPart {
  name: string
  score: number
  max: number
  detail: string
}

export interface Match {
  score: number
  label: string
  parts: MatchPart[]
  reasons: MatchReason[]
}

export interface ListingNeed {
  slug: string
  name: string
  category: string
  icon: string
  isPrimary: boolean
}

export interface ViewerApplication {
  id: number
  origin: ApplicationOrigin
  status: ApplicationStatus
}

export interface Listing {
  id: number
  title: string
  summary: string
  description: string
  owner: UserSummary
  needs: ListingNeed[]
  stack: string[]
  projectUrl: string | null
  teamSize: number
  hoursPerWeek: number
  timeline: string
  status: ListingStatus
  outcomeNote: string | null
  createdAt: string
  applicationCount: number
  pendingCount: number
  isOwner: boolean
  match: Match | null
  myApplication: ViewerApplication | null
}

export interface NeedRequest {
  slug: string
  isPrimary: boolean
}

export interface SaveListingRequest {
  title: string
  summary: string
  description: string
  needs: NeedRequest[]
  stack: string[]
  projectUrl: string
  teamSize: number
  hoursPerWeek: number
  timeline: string
}

export interface ReviewPoint {
  title: string
  detail: string
}

export interface AiReviewContent {
  verdict: string
  summary: string
  strengths: ReviewPoint[]
  risks: ReviewPoint[]
  questions: string[]
  suggestedFirstTask: string
}

export interface AiReview {
  content: AiReviewContent
  source: string
  isAi: boolean
  matchScore: number
  createdAt: string
}

export interface Application {
  id: number
  listingId: number
  listingTitle: string
  applicant: UserSummary
  owner: UserSummary
  origin: ApplicationOrigin
  message: string
  status: ApplicationStatus
  createdAt: string
  respondedAt: string | null
  match: Match
  canDecide: boolean
  canWithdraw: boolean
  canCancel: boolean
  review: AiReview | null
  contact: Contact | null
}

export interface Me {
  id: number
  email: string
  displayName: string
  openToJoin: boolean
  competencyCount: number
  openListings: number
  pendingDecisions: number
}

export interface AuthResponse {
  token: string
  user: Me
}
