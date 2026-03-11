'use client';

import { useEffect } from 'react';

import { markConversationRead } from '@/lib/actions/chat.actions';

interface ReadMarkerProps {
  conversationId: string;
}

export function ReadMarker({ conversationId }: ReadMarkerProps) {
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  return null;
}
