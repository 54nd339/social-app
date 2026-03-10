import type {
  BADGE_TYPES,
  MESSAGE_TYPES,
  POST_VISIBILITY,
  REACTION_TYPES,
  REPORT_REASONS,
} from '@/lib/constants';

export type ReactionType = (typeof REACTION_TYPES)[number];
export type PostVisibility = (typeof POST_VISIBILITY)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];
export type BadgeType = (typeof BADGE_TYPES)[number];

export type FollowStatus = 'pending' | 'accepted';
export type ConversationType = 'direct' | 'group';
export type ConversationRole = 'admin' | 'member';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type ReportEntityType = 'post' | 'comment' | 'message' | 'user';
export type ReactionEntityType = 'post' | 'comment';
export type VaultItemType = 'note' | 'link' | 'media';
export type StoryVisibility = 'public' | 'followers' | 'circle';

export type NotificationType =
  | 'reaction'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'message'
  | 'story_reaction'
  | 'thread_reply'
  | 'badge_earned'
  | 'report_update';

export type ActivityAction = 'reaction' | 'comment' | 'follow' | 'share' | 'bookmark';
