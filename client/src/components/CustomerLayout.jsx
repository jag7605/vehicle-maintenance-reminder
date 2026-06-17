import CustomerSidebar from "./CustomerSidebar";
import CustomerTopbar from "./CustomerTopbar";
import "./CustomerLayout.css";
import { Outlet } from "react-router-dom";

function CustomerLayout() {
    return (
        <div className="customer-layout">
            <CustomerSidebar />

            <div className="customer-main">
                <CustomerTopbar />

                <main className="customer-content">
                    <Outlet />
                </main>
            </div>



        </div>
    );
}

export default CustomerLayout;