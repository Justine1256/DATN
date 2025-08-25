'use client';
import React from 'react';
import { Card, List, Typography, Button, Divider } from 'antd';

const { Text } = Typography;

export interface CartByShopMobileProps {
    perShop: Array<{
        shop_id: number;
        shop_name?: string;
        subTotal: number;
        voucherDiscount: number;
        shipping: number;
        lineTotal: number;
    }>;
    grouped: Array<{
        shop_id: number;
        shop_name?: string;
        items: any[];
    }>;
    VND: (n: number) => string;
    formatImage: (img: string | string[]) => string;   // 👈 thêm
    onOpenVoucher: (shopId: number) => void;
    onClearVoucher: (shopId: number | null) => void;
}


const CartByShopMobile: React.FC<CartByShopMobileProps> = ({
    perShop,
    grouped,
    VND,
    formatImage,
    onOpenVoucher,
    onClearVoucher,
}) => {
    return (
        <div className="space-y-4">
            {grouped.map((g) => {
                const money = perShop.find((s) => s.shop_id === g.shop_id)!;

                return (
                    <Card
                        key={g.shop_id}
                        size="small"
                        style={{ borderRadius: 8 }}
                    >
                        {/* Header shop */}
                        <div style={{ marginBottom: 8, fontWeight: 600 }}>
                            Shop: {g.shop_name ?? `#${g.shop_id}`}
                        </div>

                        {/* Danh sách sản phẩm */}
                        <List
                            dataSource={g.items}
                            renderItem={(it: any) => {
                                const price =
                                    it.variant?.sale_price ??
                                    it.variant?.price ??
                                    it.product.sale_price ??
                                    it.product.price;
                                const total = price * it.quantity;

                                return (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <img
                                                    src={formatImage(it.product.image)}
                                                    alt={it.product.name}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 6,
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            }
                                            title={<Text strong>{it.product.name}</Text>}
                                        />
                                        {/* Giá + SL cùng 1 cột, thẳng hàng */}
                                        <div style={{ textAlign: 'right' }}>
                                            <Text strong type="danger" style={{ display: 'block' }}>
                                                {VND(total)}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                SL: {it.quantity}
                                            </Text>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />


                        <Divider style={{ margin: '10px 0' }} />

                        {/* Tóm tắt đơn */}
                        <div style={{ fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tạm tính</span>
                                <strong>{VND(money.subTotal)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Giảm voucher</span>
                                <span style={{ color: '#d0302f' }}>-{VND(money.voucherDiscount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Phí vận chuyển</span>
                                <span>{VND(money.shipping)}</span>
                            </div>
                            <Divider style={{ margin: '10px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tổng</span>
                                <Text strong type="danger">{VND(money.lineTotal)}</Text>
                            </div>
                        </div>

                        {/* Nút voucher */}
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <Button size="small" onClick={() => onOpenVoucher(g.shop_id)}>
                                Chọn voucher
                            </Button>
                            <Button size="small" danger onClick={() => onClearVoucher(g.shop_id)}>
                                Bỏ voucher
                            </Button>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default CartByShopMobile;
