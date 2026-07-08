import { savePushSubscription, clearPushSubscription } from "../firebase/users";
import { urlBase64ToUint8Array } from "./pushSubscriptionHelpers";

// Must match the server's VAPID_PUBLIC_KEY (same keypair on both ends).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// ---------------------------------------------------------------------------
// enableBrowserPush / disableBrowserPush
//
// The single shared implementation of "turn browser push on/off" for a
// given user. Both NotificationPopup.jsx (the first-visit popup) and
// useNotificationPreferences.js (the settings page toggle) call these same
// two functions — so whichever entry point the customer uses, the result
// is identical: a real subscription actually gets created or torn down.
// ---------------------------------------------------------------------------

/**
 * Requests Notification permission (if not already granted), registers the
 * service worker, subscribes via PushManager, and saves the subscription
 * to the given user's Firestore doc. Throws if any step fails or permission
 * is denied — callers should catch and decide how to surface that.
 */
export async function enableBrowserPush(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications aren't supported in this browser.");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY — check your .env file.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  // src/sw.js uses `import { precacheAndRoute } from "workbox-precaching"`.
  // In dev, vite-plugin-pwa serves that file unbundled, so the browser
  // must register it as a module-type worker to understand the import
  // statement — registering as a classic script (the default) throws.
  // In production the build output is bundled/transformed and a classic
  // registration works fine, so only dev needs the module type.
  const registration = await navigator.serviceWorker.register("/sw.js", {
    type: import.meta.env.DEV ? "module" : "classic",
  });

  // Wait until the service worker is actually active before subscribing —
  // subscribing too early against a still-installing worker can fail.
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  await savePushSubscription(userId, subscription);
}

/**
 * Clears the saved push subscription for the given user. Doesn't attempt
 * to unsubscribe the browser's own PushManager registration (harmless to
 * leave it — enableBrowserPush() reuses an existing one via
 * getSubscription() if present, rather than erroring on a duplicate).
 */
export async function disableBrowserPush(userId) {
  await clearPushSubscription(userId);
}