import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, updateDoc,} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import "./CustomerNotificationPage.css";

function CustomerNotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let unsubscribeNotifications = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setNotifications([]);
                setLoading(false);
                return;
            }

            console.log("Customer UID:", user.uid);

            const notificationsQuery = query(
                collection(db, "notifications"),
                where("customerId", "==", user.uid)
            );

            unsubscribeNotifications = onSnapshot(
                notificationsQuery,
                (snapshot) => {
                    const notificationList = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    notificationList.sort((a, b) => {
                        const dateA = a.sentAt?.toDate ? a.sentAt.toDate() : new Date(0);
                        const dateB = b.sentAt?.toDate ? b.sentAt.toDate() : new Date(0);
                        return dateB - dateA;
                    });

                    setNotifications(notificationList);
                    setLoading(false);
                },
                (error) => {
                    console.error("Error loading notifications:", error);
                    setError("Failed to load notifications.");
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubscribeAuth();

            if (unsubscribeNotifications) {
                unsubscribeNotifications();
            }
        };
    }, []);

    const markAsRead = async (notificationId, alreadyRead) => {
        if (alreadyRead) return;

        try {
            const notificationRef = doc(db, "notifications", notificationId);

            await updateDoc(notificationRef, {
                read: true,
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const formatDate = (sentAt) => {
        if (!sentAt) {
            return "No date";
        }

        if (sentAt.toDate) {
            return sentAt.toDate().toLocaleString();
        }

        return new Date(sentAt).toLocaleString();
    };

    if (loading) {
        return <p>Loading notifications...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Notifications</h1>

            {notifications.length === 0 ? (
                <p>No notifications yet.</p>
            ) : (
                notifications.map((notification) => (
                    <div
                        key={notification.id}
                        onClick={() =>
                            markAsRead(notification.id, notification.read)
                        }
                        className={`notification-card ${notification.read ? "read" : "unread"
                            }`}
                    >
                        <div>
                            <p>{notification.message}</p>
                            <small>{formatDate(notification.sentAt)}</small>
                        </div>

                        {!notification.read && (
                            <div className="notification-alert">!</div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default CustomerNotificationPage;