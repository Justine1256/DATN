<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Hóa đơn #{{ $order->id }}</title>
<style>
    body {
        font-family: DejaVu Sans, sans-serif;
        color: #333;
        font-size: 13px;
        margin: 20px;
    }

    h2 {
        text-align: center;
        color: #db4444;
        margin-bottom: 20px;
        font-size: 20px;
    }

    .header {
        text-align: center;
        margin-bottom: 20px;
    }

    .header img {
        height: 50px;
        margin-bottom: 5px;
    }

    .info p {
        margin: 2px 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        margin-top: 10px;
    }

    th, td {
        border: 1px solid #ddd;
        padding: 6px 8px;
    }

    th {
        background-color: #f5f5f5;
    }

    tbody tr:nth-child(even) {
        background-color: #f9f9f9;
    }

    .total {
        text-align: right;
        font-weight: bold;
        font-size: 1.1em;
        margin-top: 20px;
        color: #db4444;
    }

    .signature {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
    }

    .signature div {
        text-align: center;
        width: 48%;
    }

    .signature img {
        margin: 0 auto;
        display: block;
        height: 60px;
    }
</style>
</head>
<body>

<div class="header">
    <img src="{{ public_path('logo.png') }}" alt="Logo Shop">
    <div><strong>Shop {{ $order->shop->name ?? '---' }}</strong></div>
</div>

<h2>HÓA ĐƠN ĐƠN HÀNG #{{ $order->id }}</h2>

<div class="info">
    <p><strong>Ngày đặt:</strong> {{ \Carbon\Carbon::parse($order->created_at)->format('d/m/Y H:i') }}</p>
    <p><strong>Khách hàng:</strong> {{ $order->user->name }}</p>
    <p><strong>Email:</strong> {{ $order->user->email }}</p>
    <p><strong>Địa chỉ:</strong> {{ $order->shipping_address }}</p>
</div>

<table>
    <thead>
        <tr>
            <th>Tên sản phẩm</th>
            <th>Số lượng</th>
            <th>Giá</th>
            <th>Tổng</th>
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
</table>

<p class="total">Tổng cộng: {{ number_format($order->final_amount) }} đ</p>

<div class="signature">
    <div>
        <strong>Người mua hàng</strong>
        <p><em>{{ $order->user->name }}</em></p>
    </div>
    <div>
        <strong>Đại diện shop</strong><br>
        <small>Ngày {{ date('d/m/Y') }}</small>
        <img src="{{ public_path('dau.png') }}" alt="Dấu shop">
        <p><strong>{{ $order->shop->name }}</strong></p>
    </div>
</div>

</body>
</html>
