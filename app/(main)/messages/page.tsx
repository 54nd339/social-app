import { PenSquare } from 'lucide-react';

import { ConversationList, NewConversationDialog } from '@/components/chat';
import { Button } from '@/components/ui/button';

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-semibold">Messages</h1>
        <NewConversationDialog>
          <Button variant="ghost" size="icon-sm">
            <PenSquare className="size-4" />
          </Button>
        </NewConversationDialog>
      </div>

      <ConversationList />
    </div>
  );
}
