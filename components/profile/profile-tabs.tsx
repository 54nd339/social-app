'use client';

import { Grid3X3, Heart, MessageSquare } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileTabsProps {
  children?: React.ReactNode;
}

export function ProfileTabs({ children }: ProfileTabsProps) {
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
        <TabsTrigger
          value="replies"
          className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
        >
          <MessageSquare className="mr-1.5 size-4" />
          Replies
        </TabsTrigger>
        <TabsTrigger
          value="reactions"
          className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:shadow-none"
        >
          <Heart className="mr-1.5 size-4" />
          Reactions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-0">
        {children}
      </TabsContent>

      <TabsContent value="replies" className="mt-0">
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <MessageSquare className="text-muted-foreground/50 size-8" />
          <p className="text-muted-foreground text-sm">Replies will appear here</p>
        </div>
      </TabsContent>

      <TabsContent value="reactions" className="mt-0">
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <Heart className="text-muted-foreground/50 size-8" />
          <p className="text-muted-foreground text-sm">Reactions will appear here</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
