import { useState, useEffect, useCallback } from "react";

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    permission: "default",
    isSupported: false,
  });

  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    setState({
      isSupported,
      permission: isSupported ? Notification.permission : "denied",
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [state.isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!state.isSupported || state.permission !== "granted") return;

      try {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    },
    [state.isSupported, state.permission]
  );

  const scheduleReminder = useCallback(
    (eventId: string, eventTitle: string, eventDate: string, eventTime: string) => {
      if (!state.isSupported || state.permission !== "granted") return;

      // Store reminder in localStorage for now
      const reminders = JSON.parse(localStorage.getItem("event-reminders") || "{}");
      reminders[eventId] = { title: eventTitle, date: eventDate, time: eventTime };
      localStorage.setItem("event-reminders", JSON.stringify(reminders));

      // Calculate time until event (30 minutes before)
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);
      const reminderTime = eventDateTime.getTime() - 30 * 60 * 1000; // 30 min before
      const now = Date.now();

      if (reminderTime > now) {
        const timeout = reminderTime - now;
        setTimeout(() => {
          sendNotification(`Reminder: ${eventTitle}`, {
            body: `Your event starts in 30 minutes!`,
            tag: `event-${eventId}`,
          });
        }, Math.min(timeout, 2147483647)); // Max setTimeout value
      }
    },
    [state.isSupported, state.permission, sendNotification]
  );

  return {
    ...state,
    requestPermission,
    sendNotification,
    scheduleReminder,
  };
}
