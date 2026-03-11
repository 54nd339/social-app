'use client';

import { useEffect } from 'react';

import { usePushNotifications } from '@/hooks/use-push-notifications';

export function PushProvider() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    if (isSupported && !isSubscribed) {
      const hasDeclined = sessionStorage.getItem('push-declined');
      if (hasDeclined) return;

      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          subscribe();
        } else {
          sessionStorage.setItem('push-declined', '1');
        }
      });
    }
  }, [isSupported, isSubscribed, subscribe]);

  return null;
}
