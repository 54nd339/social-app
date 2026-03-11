'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getUserByClerkId, isUsernameTaken } from '@/lib/db/queries/user.queries';
import { userInterests, users } from '@/lib/db/schema';
import { type OnboardingInput, onboardingSchema } from '@/lib/validators/user';

export async function completeOnboarding(input: OnboardingInput) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const validated = onboardingSchema.parse(input);

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error('User not found in database');

  const taken = await isUsernameTaken(validated.username, user.id);
  if (taken) throw new Error('Username is already taken');

  await db
    .update(users)
    .set({
      username: validated.username,
      displayName: validated.displayName,
      bio: validated.bio,
      onboardingComplete: true,
    })
    .where(eq(users.id, user.id));

  if (validated.interests.length > 0) {
    await db.insert(userInterests).values(
      validated.interests.map((interest) => ({
        userId: user.id,
        interest,
      })),
    );
  }

  revalidatePath('/');
  return { success: true };
}

export async function checkUsernameAvailability(username: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await getUserByClerkId(clerkId);
  const taken = await isUsernameTaken(username, user?.id);

  return { available: !taken };
}

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  return getUserByClerkId(clerkId);
}
