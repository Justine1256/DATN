<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Hóa đơn #{{ $order->id }}</title>
    <style>
        /* CSS giữ nguyên như bản anh đã tối ưu: .shop-name, .invoice-title, ... */
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #000;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }

        .shop-name {
            font-size: 22px;
            font-weight: bold;
            margin: 10px 0;
            text-transform: uppercase;
            color: #db4444;
        }

        .shop-info {
            font-size: 13px;
            margin: 5px 0;
        }

        .invoice-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
            color: #333;
        }

        .invoice-info {
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
        }

        .invoice-info .left,
        .invoice-info .right {
            width: 48%;
        }

        .invoice-info p {
            margin: 5px 0;
            font-size: 14px;
        }

        .invoice-info strong {
            display: inline-block;
            width: 120px;
        }

        .products-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin: 20px 0;
        }

        .products-table th,
        .products-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }

        .products-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
        }

        .products-table td:nth-child(2),
        .products-table td:nth-child(3),
        .products-table td:nth-child(4) {
            text-align: right;
        }

        .products-table th:nth-child(2),
        .products-table th:nth-child(3),
        .products-table th:nth-child(4) {
            text-align: center;
        }

        .total-section {
            text-align: right;
            margin: 20px 0;
            padding: 10px;
            border-top: 2px solid #000;
        }

        .total-amount {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
            color: #db4444;
        }

        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
        }

        .signature-box {
            width: 45%;
            text-align: center;
        }

        .signature-box h4 {
            margin: 10px 0;
            font-size: 14px;
            text-transform: uppercase;
            color: #333;
        }

        .signature-space {
            height: 80px;
            margin: 20px 0;
            border-bottom: 1px solid #000;
        }

        .signature-name {
            font-weight: bold;
            margin-top: 10px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            color: #666;
        }

        .date-time {
            text-align: right;
            font-size: 13px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="shop-name">Shop {{ $shop->name }}</div>
        <div class="shop-info">Địa chỉ: {{ $shop->address }}</div>
        <div class="shop-info">Điện thoại: {{ $shop->phone }} | Email: {{ $shop->email }}</div>
    </div>

    <div class="invoice-title">Hóa Đơn Bán Hàng</div>
    <div class="date-time">Ngày: {{ $order->created_at->format('d/m/Y - H:i') }}</div>

    <div class="invoice-info">
        <div class="left">
            <p><strong>Số hóa đơn:</strong> #{{ $order->id }}</p>
            <p><strong>Nhân viên:</strong> {{ $order->staff_name ?? '---' }}</p>
            <p><strong>Thanh toán:</strong> {{ $order->payment_method }}</p>
        </div>
        <div class="right">
            <p><strong>Khách hàng:</strong> {{ $order->user->name }}</p>
            <p><strong>Điện thoại:</strong> {{ $order->user->phone }}</p>
            <p><strong>Địa chỉ:</strong> {{ $order->shipping_address }}</p>
        </div>
    </div>

    <table class="products-table">
        <thead>
            <tr>
                <th>Tên sản phẩm</th>
                <th>SL</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->orderDetails as $item)
            <tr>
                <td>{{ $item->product->name }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format($item->price_at_time) }}</td>
                <td>{{ number_format($item->subtotal) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-section">
        <p>Tổng số lượng: {{ $order->orderDetails->sum('quantity') }} sản phẩm</p>
        <p class="total-amount">Tổng cộng: {{ number_format($order->final_amount) }} đ</p>
        <p style="font-style: italic;">({{ \App\Helpers\NumberHelper::convertNumberToVietnameseWords($order->final_amount) }})</p>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <h4>Khách hàng</h4>
            <p style="font-size: 12px;">(Ký, ghi rõ họ tên)</p>
            <div class="signature-space"></div>
            <div class="signature-name">{{ $order->user->name }}</div>
        </div>

        <div class="signature-box">
            <h4>Người bán hàng</h4>
            <p style="font-size: 12px;">(Ký, đóng dấu)</p>
            <div class="signature-space"></div>
            <div class="signature-name">{{ $order->staff_name ?? '---' }}</div>
        </div>
    </div>

    <div class="footer">
        <p>Cảm ơn quý khách đã mua hàng tại cửa hàng!</p>
        <p>Hàng đã bán không được đổi trả (trừ lỗi từ nhà sản xuất)</p>
    </div>
</body>
</html>
