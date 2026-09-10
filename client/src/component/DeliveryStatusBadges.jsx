import "./DeliveryStatusBadges.css";

const CHANNEL_LABELS = { email: "Email", browser: "Browser" };
const ALL_CHANNELS = ["email", "browser"];

function DeliveryStatusBadges({ deliveryStatus, channel }) {
  const channels = channel ? [channel] : ALL_CHANNELS;

  if (!deliveryStatus || Object.keys(deliveryStatus).length === 0) {
    return <span className="channel-disabled">No delivery data</span>;
  }

  return (
    <span>
      {channels.map((ch) => {
        if (!(ch in deliveryStatus)) {
          return (
            <span key={ch} className="channel-item channel-disabled">
              {channel ? "Disabled" : `${CHANNEL_LABELS[ch]}: disabled`}
            </span>
          );
        }

        const status = deliveryStatus[ch];
        return (
          <span
            key={ch}
            className={`channel-item ${status === "sent" ? "channel-sent" : "channel-failed"}`}
          >
            {channel ? (status === "sent" ? "Sent" : "Failed") : `${CHANNEL_LABELS[ch]}: ${status}`}
          </span>
        );
      })}
    </span>
  );
}

export default DeliveryStatusBadges;