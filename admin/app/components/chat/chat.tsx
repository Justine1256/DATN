"use client";
import { useState, useRef } from "react";
import { Paperclip, Send, Search, Image, MoreHorizontal, X } from "lucide-react";

export default function AdminChat() {
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showImageUpload, setShowImageUpload] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const users = [
        { id: 1, name: "Gaston Lapierre", avatar: "/avatar1.png", online: true, last: "How are you today?", time: "10:20am", unread: 3 },
        { id: 2, name: "Fantina LeBatelier", avatar: "/avatar2.png", online: true, last: "Hey! Reminder for tomorrow...", time: "11:03am", unread: 0 },
        { id: 3, name: "Gilbert Chicoine", avatar: "/avatar3.png", online: false, last: "typing...", time: "now", unread: 1 },
        { id: 4, name: "Mignonette Brodeur", avatar: "/avatar4.png", online: true, last: "Are we meeting today?", time: "Yesterday", unread: 0 },
    ];

    const [selectedUser, setSelectedUser] = useState(users[2]);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("File uploaded:", file);
            setShowImageUpload(false);
        }
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            console.log("Message sent:", message);
            setMessage("");
        }
    };

    return (
        <div className="w-full flex justify-center">
            <div className="max-w-9xl w-full flex h-[82vh] bg-gray-50 border rounded-lg shadow overflow-hidden">
                {/* Sidebar */}
                <div className="w-[320px] border-r bg-white flex flex-col">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#db4444]"
                            />
                        </div>
                    </div>
                    <div className="p-4 border-b">
                        <div className="flex gap-2">
                            {users.slice(0, 4).map(user => (
                                <div key={user.id} className="relative">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gray-200" />
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.online ? "bg-green-500" : "bg-gray-400"}`}></span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-4 py-2 border-b">
                        <span className="border-b-2 border-[#db4444] text-[#db4444] pb-1 font-medium cursor-pointer">
                            Chat
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 ${selectedUser.id === user.id ? "bg-gray-200 text-gray-900 font-semibold" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="relative">
                                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-gray-200" />
                                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.online ? "bg-green-500" : "bg-gray-400"}`}></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{user.name}</div>
                                        <div className="text-sm truncate">{user.last}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-xs text-gray-500">{user.time}</div>
                                    {user.unread > 0 && (
                                        <div className="bg-[#db4444] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {user.unread}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <div className="flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-white">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full bg-gray-200" />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${selectedUser.online ? "bg-green-500" : "bg-gray-400"}`}></span>
                            </div>
                            <div>
                                <div className="font-semibold">{selectedUser.name}</div>
                                <div className="text-sm text-green-600">{selectedUser.online ? "Đang hoạt động" : "Offline"}</div>
                            </div>
                        </div>
                        <div className="flex gap-4 text-gray-600">
                            <Paperclip className="cursor-pointer hover:text-[#db4444]" size={20} />
                            <MoreHorizontal className="cursor-pointer hover:text-[#db4444]" size={20} />
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-lg max-w-md border">
                                Xin chào, cảm ơn bạn đã liên hệ.
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="bg-[#db4444] text-white p-3 rounded-lg max-w-md">
                                Tôi rất trân trọng sự thành thật của bạn. Bạn có thể nói rõ hơn về những thách thức đó không?
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-lg max-w-md border">
                                Vâng, tôi sẽ giải thích chi tiết...
                            </div>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t bg-white">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button onClick={() => setShowImageUpload(!showImageUpload)} className="p-2 text-gray-600 hover:text-[#db4444] hover:bg-gray-100 rounded-full transition-colors">
                                    <Image size={20} />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                {showImageUpload && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg p-2 space-y-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded w-full text-left">
                                            <Image size={16} /> Tải ảnh lên
                                        </button>
                                        <button onClick={() => setShowImageUpload(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded w-full text-left">
                                            <X size={16} /> Hủy
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                type="text"
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 p-3 border rounded-lg focus:outline-none focus:border-[#db4444]"
                            />
                            <button onClick={handleSendMessage} className="bg-[#db4444] p-3 rounded-lg text-white hover:bg-[#c23e3e] transition-colors">
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
