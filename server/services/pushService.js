const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPush(pushSubscription, message) {
  const payload = JSON.stringify({ message });
  await webpush.sendNotification(pushSubscription, payload);
}

module.exports = { sendPush };