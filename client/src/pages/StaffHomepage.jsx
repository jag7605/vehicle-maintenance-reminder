import StaffLayout from "../component/StaffLayout";
import NotificationPopup from "../component/NotificationPopup";

function StaffHomepage() {
  return (
    <StaffLayout title="Dashboard">
      <NotificationPopup />
      This is Dashboard
    </StaffLayout>
  );
}

export default StaffHomepage;