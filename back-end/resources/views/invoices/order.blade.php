<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Hóa đơn #{{ $order->id }}</title>
    <style>
        body {
            font-family: "DejaVu Sans", sans-serif;
            color: #333;
            font-size: 13px;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }

        .header {
            background: #db4444;
            color: #fff;
            text-align: center;
            padding: 15px;
            margin-bottom: 25px;
        }

        .header h1 {
            margin: 0;
            font-size: 22px;
        }

        .header small {
            font-size: 12px;
        }

        table.info-table {
            width: 100%;
            margin-bottom: 30px;
        }

        table.info-table td {
            vertical-align: top;
            width: 50%;
        }

        table.info-table strong {
            display: block;
            margin-bottom: 5px;
        }

        table.detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        table.detail-table th,
        table.detail-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }

        table.detail-table th {
            color: #db4444;
            text-align: center;
        }

        table.detail-table td:nth-child(2),
        table.detail-table td:nth-child(3),
        table.detail-table td:nth-child(4) {
            text-align: right;
        }

        table.detail-table tfoot td {
            border-top: 2px solid #db4444;
            font-weight: bold;
        }

        table.detail-table tfoot td:last-child {
            color: #db4444;
        }

        .signature {
            text-align: right;
            margin-top: 50px;
        }

        .signature .name {
            margin-top: 60px;
            font-weight: bold;
        }

        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 40px;
        }
    </style>
</head>

<body>

    <div class="header">
        <h1>{{ $order->shop->name ?? 'Tên shop' }}</h1>
        <small>#{{ $order->id }} | {{ $order->created_at->format('d/m/Y') }}</small>
    </div>

    <table class="info-table">
        <tr>
            <td>
                <strong>HÓA ĐƠN CHO:</strong>
                {{ $order->user->name }}<br>
                {{ $order->shipping_address }}<br>
                {{ $order->user->email }}
            </td>
            <td>
                <strong>THANH TOÁN CHO:</strong>
                {{ $order->shop->name ?? '---' }}<br>
                {{ $order->shop->phone ?? '---' }} | {{ $order->shop->email ?? '---' }}
            </td>
        </tr>
    </table>

    <table class="detail-table">
        <thead>
            <tr>
                <th>MÔ TẢ</th>
                <th>SỐ LƯỢNG</th>
                <th>ĐƠN GIÁ</th>
                <th>THÀNH TIỀN</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->orderDetails as $item)
                <tr>
                    <td>{{ $item->product->name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format($item->price_at_time) }} đ</td>
                    <td>{{ number_format($item->subtotal) }} đ</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" style="text-align:right;">Tổng cộng:</td>
                <td>{{ number_format($order->final_amount) }} đ</td>
            </tr>
        </tfoot>
    </table>

    <div class="signature">
        <p>Khách hàng ký & ghi rõ họ tên</p>
        <div class="name">{{ $order->user->name }}</div>
    </div>

    <div class="footer">
        Cảm ơn quý khách đã mua hàng!<br>
        Hàng đã bán không đổi trả (trừ lỗi từ nhà sản xuất)
    </div>

</body>
</html>
