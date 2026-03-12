'use client';

import { Grid3X3, Heart, MessageSquare } from 'lucide-react';

import { ProfileReactions } from '@/components/profile/profile-reactions';
import { ProfileReplies } from '@/components/profile/profile-replies';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileTabsProps {
  username: string;
  isSelf: boolean;
  showReplies: boolean;
  showReactions: boolean;
  children?: React.ReactNode;
}

export function ProfileTabs({
  username,
  isSelf,
  showReplies,
  showReactions,
  children,
}: ProfileTabsProps) {
  const canSeeReplies = isSelf || showReplies;
  const canSeeReactions = isSelf || showReactions;

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger
          value="posts"
          className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
        >
          <Grid3X3 className="mr-1.5 size-4" />
          Posts
        </TabsTrigger>
        {canSeeReplies && (
          <TabsTrigger
            value="replies"
            className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
          >
            <MessageSquare className="mr-1.5 size-4" />
            Replies
          </TabsTrigger>
        )}
        {canSeeReactions && (
          <TabsTrigger
            value="reactions"
            className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
          >
            <Heart className="mr-1.5 size-4" />
            Reactions
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="posts" className="mt-0">
        {children}
      </TabsContent>

      {canSeeReplies && (
        <TabsContent value="replies" className="mt-0">
          <ProfileReplies username={username} />
        </TabsContent>
      )}

      {canSeeReactions && (
        <TabsContent value="reactions" className="mt-0">
          <ProfileReactions username={username} />
        </TabsContent>
      )}
    </Tabs>
  );
}
