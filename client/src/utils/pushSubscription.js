import { savePushSubscription, clearPushSubscription } from "../firebase/users";
import { urlBase64ToUint8Array } from "./pushSubscriptionHelpers";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

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

  // In dev, vite-plugin-pwa (injectManifest + devOptions.enabled) serves
  // the worker at a different virtual path than the production build
  // output — registering "/sw.js" in dev 404s to index.html and throws
  // "unsupported MIME type ('text/html')". Production build emits the
  // real /sw.js at the root as configured.
  const swUrl = import.meta.env.DEV ? "/dev-sw.js?dev-sw" : "/sw.js";

  const registration = await navigator.serviceWorker.register(swUrl, {
    type: import.meta.env.DEV ? "module" : "classic",
  });

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

export async function disableBrowserPush(userId) {
  await clearPushSubscription(userId);
}