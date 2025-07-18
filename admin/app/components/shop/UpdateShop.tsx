import { useState, useEffect } from "react";
import { API_BASE_URL, STATIC_BASE_URL } from "@/utils/api";

interface Shop {
    id: number;
    name: string;
    description: string;
    logo: string;
    phone: string;
    email: string;
    total_sales: number;
    status: string;
}

const UpdateShop = () => {
    const [shop, setShop] = useState<Shop>({
        id: 0,
        name: "",
        description: "",
        logo: "",
        phone: "",
        email: "",
        total_sales: 0,
        status: "activated",
    });

    // Lấy token từ localStorage hoặc sessionStorage
    const token = localStorage.getItem("token");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShop((prevShop) => ({
            ...prevShop,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        console.log("Token:", token);  // Kiểm tra token

        try {
            const response = await fetch(`${API_BASE_URL}/shop/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify(shop),
            });

            const data = await response.json();
            console.log("API Response:", data);  // In ra kết quả API

            if (response.ok) {
                alert("Cập nhật cửa hàng thành công!");
            } else {
                alert(`Lỗi: ${data.message}`);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API cập nhật cửa hàng:", error);
            alert("Có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    useEffect(() => {
        console.log("Shop ID: ", shop.id);  // Kiểm tra giá trị shop.id
        if (shop.id) {
            const fetchShopDetails = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/shop/${shop.id}`);
                    const data = await response.json();
                    console.log("Thông tin cửa hàng:", data);  // Kiểm tra thông tin cửa hàng

                    setShop(data.shop);
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin cửa hàng:", error);
                }
            };

            fetchShopDetails();
        }
    }, [shop.id]);  // Kiểm tra shop.id mỗi lần thay đổi


    useEffect(() => {
        // Chỉ gọi API khi component mount và khi shop.id đã có giá trị
        if (shop.id) {
            const fetchShopDetails = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/shop/${shop.id}`);
                    const data = await response.json();
                    setShop(data.shop);
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin cửa hàng:", error);
                }
            };

            fetchShopDetails();
        }
    }, [shop.id]); // Chỉ gọi lại khi shop.id thay đổi

    return (
        <div>
            <h1>Cập nhật thông tin cửa hàng</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Tên cửa hàng:</label>
                    <input
                        type="text"
                        name="name"
                        value={shop.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Mô tả:</label>
                    <textarea
                        name="description"
                        value={shop.description}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>URL Logo:</label>
                    <input
                        type="text"
                        name="logo"
                        value={shop.logo}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Số điện thoại:</label>
                    <input
                        type="text"
                        name="phone"
                        value={shop.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={shop.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Trạng thái:</label>
                    <select
                        name="status"
                        value={shop.status}
                        onChange={handleChange}
                    >
                        <option value="activated">Đã kích hoạt</option>
                        <option value="deactivated">Chưa kích hoạt</option>
                    </select>
                </div>
                <button type="submit">Cập nhật cửa hàng</button>
            </form>
        </div>
    );
};

export default UpdateShop;
