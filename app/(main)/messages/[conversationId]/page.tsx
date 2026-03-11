import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import { MessageInput, MessageList } from '@/components/chat';
import { getUserByClerkId } from '@/lib/db/queries/user.queries';

import { ConversationHeader } from './conversation-header';
import { ReadMarker } from './read-marker';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId) return notFound();

  const user = await getUserByClerkId(clerkId);
  if (!user) return notFound();

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col md:h-screen">
      <ReadMarker conversationId={conversationId} />
      <ConversationHeader conversationId={conversationId} />
      <MessageList conversationId={conversationId} currentUserId={user.id} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
}
