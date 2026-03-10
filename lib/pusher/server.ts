import Pusher from 'pusher';

import { env } from '@/lib/env';

export const pusherServer = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});
