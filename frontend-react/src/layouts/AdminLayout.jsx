import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import Topbar from "../components/layout/Topbar";
import useAuth from "../hooks/useAuth";
import NotificationPopup from "../components/ui/NotificationPopup";

const AdminLayout = () => {
    const { user } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-10 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-[1400px] mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
            <NotificationPopup
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
};

export default AdminLayout;