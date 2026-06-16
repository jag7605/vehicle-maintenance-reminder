import Topbar from "../component/TopBar";
import "../component/TopBar.css";
import Sidebar from "../component/Sidebar";

function StaffHomepage() {
    return (
        <>
        <Topbar title="Dashboard"/>
        
        <div className="dashboard-layout"></div>
        <Sidebar />

        <main>
            This is Dashboard
        </main>
        
        </>
    )
    }
    export default StaffHomepage;