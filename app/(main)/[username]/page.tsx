import { auth } from '@clerk/nextjs/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProfileHeader, ProfilePosts, ProfileTabs } from '@/components/profile';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getProfileByUsername } from '@/lib/db/queries/profile.queries';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId) return notFound();

  const currentUser = await getUserByClerkId(clerkId);
  if (!currentUser) return notFound();

  const profile = await getProfileByUsername(username, currentUser.id);
  if (!profile) return notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{profile.displayName ?? profile.username}</h1>
          <p className="text-muted-foreground text-xs">{profile.postCount} posts</p>
        </div>
      </div>

      <ProfileHeader profile={profile} />
      <Separator />
      <ProfileTabs>
        <ProfilePosts username={profile.username} />
      </ProfileTabs>
    </div>
  );
}
