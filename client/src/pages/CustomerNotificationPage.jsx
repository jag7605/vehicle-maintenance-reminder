import { useState } from "react";
import "./CustomerNotificationPage.css";

function CustomerNotificationPage() {
    const [notifications, setNotifications] = useState([
        {
            id: "1",
            message: "VMR Garage: Your Toyota Corolla is due for service on 20 July.",
            sentAt: new Date(),
            read: false,
        },
        {
            id: "2",
            message: "VMR Garage: Your Honda Civic service reminder was sent.",
            sentAt: new Date(),
            read: false,
        },
        {
            id: "3",
            message: "VMR Garage: Your vehicle appointment reminder has been sent.",
            sentAt: new Date(),
            read: true,
        },
    ]);

    const markAsRead = (notificationId) => {
        const updatedNotifications = notifications.map((notification) => {
            if (notification.id === notificationId) {
                return {
                    ...notification,
                    read: true,
                };
            }

            return notification;
        });

        setNotifications(updatedNotifications);
    };

    const unreadCount = notifications.filter(
        (notification) => notification.read === false
    ).length;

    return (
        <div>
            <h1>Notifications</h1>

            <p>
                Unread notifications: <strong>{unreadCount}</strong>
            </p>

            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`notification-card ${notification.read ? "read" : "unread"}`}
                >
                    <div>
                        <p>{notification.message}</p>
                        <small>{notification.sentAt.toLocaleString()}</small>
                    </div>

                    {!notification.read && (
                        <div className="notification-alert">
                            !
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default CustomerNotificationPage;