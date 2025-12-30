import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator) {
      const ready = await navigator.serviceWorker.ready;
      const sub = await ready.pushManager.getSubscription();
      setSubscription(sub);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported on this device.');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('Notifications enabled!');
      // Here we would subscribe to push manager
      // subscribeToPush();
    }
  };

  const subscribeToPush = async () => {
    // Requires VAPID Key from backend
    // const VAPID_KEY = '...';
    // const ready = await navigator.serviceWorker.ready;
    // const sub = await ready.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
    // });
    // setSubscription(sub);
    // Send sub to backend...
    console.log('Push subscription logic placeholder');
  };

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-50">
        <BellOff className="w-4 h-4" />
        <span>Notifications blocked</span>
      </div>
    );
  }

  if (subscription) {
    return (
      <div className="flex items-center gap-2 text-xs text-aurora-200">
        <Bell className="w-4 h-4 text-aurora-400" />
        <span>Updates enabled</span>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-midnight-800 border border-midnight-600 hover:border-aurora-500/50 transition-colors text-xs text-shadow-200"
    >
      <Bell className="w-3 h-3" />
      <span>Enable Notifications</span>
    </button>
  );
}
