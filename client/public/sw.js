self.addEventListener("install", (event) => {
  self.skipWaiting();
});
 
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
 
self.addEventListener("push", (event) => {
  let data = {};
 
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // pushService.js sends JSON.stringify({ message }) — if that ever
    // changes shape or fails to parse, fall back to plain text so a
    // notification still shows rather than silently dropping.
    data = { message: event.data ? event.data.text() : "You have a new notification." };
  }
 
  const title = data.title || "Garage Notification";
  const options = {
    body: data.message || "You have a new notification.",
    icon: "/notification-icon.png", // optional — safe to remove if you don't have one
    badge: "/notification-icon.png",
  };
 
  event.waitUntil(self.registration.showNotification(title, options));
});
 
// Optional: focus/open the app when the notification itself is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});