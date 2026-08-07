import "./DeliveryStatusBadges.css";

const CHANNEL_LABELS = { email: "Email", browser: "Browser", sms: "SMS" };
const ALL_CHANNELS = ["email", "browser", "sms"];

function DeliveryStatusBadges({ deliveryStatus }) {
  if (!deliveryStatus || Object.keys(deliveryStatus).length === 0) {
    return <span className="channel-disabled">No delivery data</span>;
  }

  return (
    <span>
      {ALL_CHANNELS.map((channel) => {
        if (!(channel in deliveryStatus)) {
          return (
            <span key={channel} className="channel-item channel-disabled">
              {CHANNEL_LABELS[channel]}: disabled
            </span>
          );
        }

        const status = deliveryStatus[channel];
        return (
          <span
            key={channel}
            className={`channel-item ${status === "sent" ? "channel-sent" : "channel-failed"}`}
          >
            {CHANNEL_LABELS[channel]}: {status}
          </span>
        );
      })}
    </span>
  );
}

export default DeliveryStatusBadges;