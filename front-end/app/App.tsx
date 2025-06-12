import { useState } from "react";
import Header from "./components/common/Header";
import AccountSidebar from "./components/common/AccountSidebar";

export default function App() {
    // Quản lý trạng thái user trong App.tsx
    const [user, setUser] = useState({
        name: "John Doe",
        role: "admin",
        avatar: "initial-avatar.jpg", // Avatar mặc định
    });

    // Hàm thay đổi avatar
    const handleAvatarChange = (newAvatar: string) => {
        setUser((prevUser) => ({
            ...prevUser,
            avatar: newAvatar, // Cập nhật avatar
        }));
    };

    return (
        <div className="flex">
            {/* Truyền user và hàm thay đổi avatar vào Header và AccountSidebar */}
            <Header user={user} />
            <AccountSidebar user={user} onAvatarChange={handleAvatarChange} />
        </div>
    );
}
