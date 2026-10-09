// Mirrors the DTOs in backend/CareerPath.Api/Dtos. Keep both sides in sync.

export type Role = 'Student' | 'Expert'
export type StepLevel = 'Beginner' | 'Intermediate' | 'JobReady'
export type TopicKind = 'Question' | 'Advice' | 'Experience' | 'Resource'
export type CollaborationStatus = 'Pending' | 'Accepted' | 'Declined'
export type ConnectionState = 'None' | 'Self' | 'Outgoing' | 'Incoming' | 'Connected'

export interface Me {
  id: number
  email: string
  displayName: string
  role: Role
  expertTitle: string | null
  interestSlugs: string[]
  xp: number
  level: number
  levelTitle: string
  xpPerLevel: number
  pendingRequests: number
}

export interface AuthResponse {
  token: string
  user: Me
}

export interface PlatformStats {
  paths: number
  roadmapSteps: number
  members: number
  experts: number
  topics: number
  collaborations: number
}

export interface FieldSummary {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  isActive: boolean
  subFieldCount: number
}

export interface SubFieldCard {
  id: number
  slug: string
  name: string
  icon: string
  tagline: string
  entryDifficulty: number
  timeToJobReady: string
  stepCount: number
  learnerCount: number
  topicCount: number
}

export interface FieldDetail {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  isActive: boolean
  subFields: SubFieldCard[]
}

export interface RoadmapStep {
  id: number
  order: number
  title: string
  description: string
  level: StepLevel
  estimatedHours: number
  resourceTitle: string
  resourceUrl: string
}

export interface CommunityLink {
  id: number
  name: string
  url: string
  platform: string
  description: string
}

export interface SubFieldDetail {
  id: number
  slug: string
  name: string
  icon: string
  tagline: string
  description: string
  dayInTheLife: string
  entryDifficulty: number
  timeToJobReady: string
  keySkills: string[]
  firstJobs: string[]
  goodFitIf: string[]
  thinkTwiceIf: string[]
  field: { slug: string; name: string }
  roadmap: RoadmapStep[]
  communities: CommunityLink[]
  learnerCount: number
  topicCount: number
  isJoined: boolean
  completedStepIds: number[]
}

export interface JoinResult {
  isJoined: boolean
  learnerCount: number
}

export interface ProgressResult {
  subFieldSlug: string
  completedStepIds: number[]
  completed: number
  total: number
  xp: number
  level: number
  levelTitle: string
  leveledUp: boolean
}

export interface Interest {
  slug: string
  name: string
  fieldSlug: string
}

export interface UserSummary {
  id: number
  displayName: string
  headline: string
  role: Role
  expertTitle: string | null
  location: string | null
  skills: string[]
  interests: Interest[]
  openToCollaborate: boolean
  collaborationNote: string
  xp: number
  level: number
  levelTitle: string
}

export interface PathMember {
  user: UserSummary
  completed: number
  total: number
}

export interface SubFieldPeople {
  experts: PathMember[]
  learners: PathMember[]
}

export interface Author {
  id: number
  displayName: string
  role: Role
  expertTitle: string | null
}

export interface TopicSummary {
  id: number
  title: string
  kind: TopicKind
  excerpt: string
  author: Author
  createdAt: string
  lastActivityAt: string
  replyCount: number
  hasExpertReply: boolean
  subFieldSlug: string
  subFieldName: string
  fieldSlug: string
}

export interface Reply {
  id: number
  body: string
  author: Author
  createdAt: string
}

export interface TopicDetail {
  id: number
  title: string
  kind: TopicKind
  body: string
  author: Author
  createdAt: string
  subFieldSlug: string
  subFieldName: string
  fieldSlug: string
  replies: Reply[]
}

export interface PathProgress {
  slug: string
  name: string
  fieldSlug: string
  completed: number
  total: number
}

export interface ProfileTopic {
  id: number
  title: string
  subFieldName: string
  createdAt: string
  replyCount: number
}

export interface Contact {
  email: string
  contactHandle: string | null
}

export interface UserProfile {
  user: UserSummary
  bio: string
  gitHubUrl: string | null
  linkedInUrl: string | null
  joinedAt: string
  paths: PathProgress[]
  recentTopics: ProfileTopic[]
  stats: { stepsCompleted: number; topics: number; replies: number; collaborations: number }
  xpPerLevel: number
  connection: { state: ConnectionState; requestId: number | null }
  contact: Contact | null
}

export interface UpdateProfileRequest {
  displayName: string
  headline: string
  bio: string
  location: string
  skills: string[]
  interestSlugs: string[]
  openToCollaborate: boolean
  collaborationNote: string
  gitHubUrl: string
  linkedInUrl: string
  contactHandle: string
}

export interface Suggestion {
  user: UserSummary
  matchLabel: string
  reasons: string[]
}

export interface Collaboration {
  id: number
  direction: 'Incoming' | 'Outgoing'
  otherUser: UserSummary
  message: string
  subFieldSlug: string | null
  subFieldName: string | null
  status: CollaborationStatus
  createdAt: string
  respondedAt: string | null
  contact: Contact | null
}
