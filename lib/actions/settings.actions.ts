'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  type PrivacySettingsInput,
  privacySettingsSchema,
  type ProfileSettingsInput,
  profileSettingsSchema,
  type WellbeingSettingsInput,
  wellbeingSettingsSchema,
} from '@/lib/validators/settings';

export async function updateProfileSettings(input: ProfileSettingsInput) {
  const user = await getAuthenticatedUser();
  const validated = profileSettingsSchema.parse(input);

  await db
    .update(users)
    .set({
      displayName: validated.displayName,
      bio: validated.bio,
      location: validated.location,
      website: validated.website || null,
      statusText: validated.statusText || null,
      statusEmoji: validated.statusEmoji || null,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/settings');
  revalidatePath(`/${user.username}`);
  return { success: true };
}

export async function updatePrivacySettings(input: PrivacySettingsInput) {
  const user = await getAuthenticatedUser();
  const validated = privacySettingsSchema.parse(input);

  await db
    .update(users)
    .set({
      isPrivate: validated.isPrivate,
      profileViewsEnabled: validated.profileViewsEnabled,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/settings');
  return { success: true };
}

export async function updateWellbeingSettings(input: WellbeingSettingsInput) {
  const user = await getAuthenticatedUser();
  const validated = wellbeingSettingsSchema.parse(input);

  await db
    .update(users)
    .set({
      dailyLimitMinutes: validated.dailyLimitMinutes,
      breakReminderMinutes: validated.breakReminderMinutes,
      quietHoursStart: validated.quietHoursStart,
      quietHoursEnd: validated.quietHoursEnd,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/settings');
  return { success: true };
}
