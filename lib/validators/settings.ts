import { z } from 'zod/v4';

import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH, MAX_STATUS_LENGTH } from '@/lib/constants';

export const profileSettingsSchema = z.object({
  displayName: z.string().max(MAX_DISPLAY_NAME_LENGTH).optional(),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  statusText: z.string().max(MAX_STATUS_LENGTH).optional(),
  statusEmoji: z.string().max(10).optional(),
});

export const privacySettingsSchema = z.object({
  isPrivate: z.boolean(),
  profileViewsEnabled: z.boolean(),
  showReplies: z.boolean(),
  showReactions: z.boolean(),
});

export const wellbeingSettingsSchema = z.object({
  dailyLimitMinutes: z.number().int().min(0).max(1440).nullable(),
  breakReminderMinutes: z.number().int().min(0).max(480).nullable(),
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type WellbeingSettingsInput = z.infer<typeof wellbeingSettingsSchema>;
