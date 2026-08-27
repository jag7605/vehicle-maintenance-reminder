import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, updateDoc, } from "firebase/firestore";
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
                        const dateA = a.sentAt?.toDate
                            ? a.sentAt.toDate()
                            : new Date(0);

                        const dateB = b.sentAt?.toDate
                            ? b.sentAt.toDate()
                            : new Date(0);

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

        const date = sentAt.toDate ? sentAt.toDate() : new Date(sentAt);

        const today = new Date();

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const time = date
            .toLocaleTimeString("en-NZ", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            .toUpperCase();

        const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        const isYesterday =
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        if (isToday) {
            return `Today, ${time}`;
        }

        if (isYesterday) {
            return `Yesterday, ${time}`;
        }

        const normalDate = date.toLocaleDateString("en-NZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        return `${normalDate}, ${time}`;
    };

    if (loading) {
        return <p>Loading notifications...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="customer-notification-page">

            <div className="page-header">
                <h1>Notifications</h1>
            </div>

            <div className="card customer-notification-card">

                {notifications.length === 0 ? (
                    <p className="customer-notification-empty">
                        No notifications yet.
                    </p>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() =>
                                markAsRead(
                                    notification.id,
                                    notification.read
                                )
                            }
                            className={`notif-row ${notification.read ? "read" : "unread"
                                }`}
                        >

                            <div className="notif-main">

                                {!notification.read && (
                                    <span className="unread-dot"></span>
                                )}

                                <span>
                                    {notification.message}
                                </span>

                            </div>

                            <p className="notif-meta">
                                {formatDate(notification.sentAt)}
                            </p>

                        </div>
                    ))
                )}

            </div>
        </div>
    );
}

export default CustomerNotificationPage;