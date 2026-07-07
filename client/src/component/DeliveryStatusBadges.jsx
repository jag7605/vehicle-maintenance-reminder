const CHANNEL_LABELS = { email: "Email", browser: "Browser", sms: "SMS" };
const ALL_CHANNELS = ["email", "browser", "sms"];
 
function DeliveryStatusBadges({ deliveryStatus }) {
  if (!deliveryStatus || Object.keys(deliveryStatus).length === 0) {
    return <span style={{ color: "#999" }}>No delivery data</span>;
  }
 
  return (
    <span>
      {ALL_CHANNELS.map((channel) => {
        if (!(channel in deliveryStatus)) {
          return (
            <span key={channel} style={{ marginRight: "8px", color: "#999" }}>
              {CHANNEL_LABELS[channel]}: disabled
            </span>
          );
        }
 
        const status = deliveryStatus[channel];
        return (
          <span
            key={channel}
            style={{ marginRight: "8px", color: status === "sent" ? "green" : "red" }}
          >
            {CHANNEL_LABELS[channel]}: {status}
          </span>
        );
      })}
    </span>
  );
}
 
export default DeliveryStatusBadges;