<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Hóa đơn #{{ $order->id }}</title>
<style>
    body {
        font-family: DejaVu Sans, sans-serif;
        color: #333;
        margin: 20px;
        font-size: 13px;
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

    .info {
        margin-bottom: 20px;
        line-height: 1.6;
    }

    .info p {
        margin: 2px 0;
    }

    h3 {
        margin-top: 20px;
        margin-bottom: 10px;
        color: #444;
        font-size: 16px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 12px;
    }

    thead {
        background-color: #f5f5f5;
    }

    th {
        text-align: left;
        padding: 8px;
        border: 1px solid #ddd;
        font-weight: bold;
    }

    td {
        border: 1px solid #ddd;
        padding: 6px 8px;
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
    }

    .signature img {
        opacity: 0.5;
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
    <p><strong>Ngày đặt:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
    <p><strong>Khách hàng:</strong> {{ $order->user->name }}</p>
    <p><strong>Email:</strong> {{ $order->user->email }}</p>
    <p><strong>Địa chỉ:</strong> {{ $order->shipping_address }}</p>
</div>

<h3>Danh sách sản phẩm</h3>

<table>
    <thead>
        <tr>
            <th style="width: 40%">Tên sản phẩm</th>
            <th style="width: 15%">Số lượng</th>
            <th style="width: 20%">Giá</th>
            <th style="width: 25%">Tổng</th>
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
        <small>Ngày {{ now()->format('d/m/Y') }}</small>
        <div style="position: relative; height: 80px;">
            <img src="{{ public_path('dau-shop.png') }}" style="position: absolute; left: 50%; top: 0; transform: translateX(-50%); height: 60px;">
            <p style="margin-top: 65px;">
                {{ $order->shop->name }}
            </p>
        </div>
    </div>
</div>
<div class="signature">
    <div>
        <strong>Người mua hàng</strong>
        <p><em>{{ $order->user->name }}</em></p>
    </div>
    <div>
        <strong>Đại diện shop</strong><br>
        <small>Ngày {{ now()->format('d/m/Y') }}</small>
        <div style="position: relative; height: 80px;">
            <img src="{{ public_path('dau.png') }}" style="position: absolute; left: 50%; top: 0; transform: translateX(-50%); height: 60px;">
            <p style="margin-top: 65px;">
                {{ $order->shop->name }}
            </p>
        </div>
    </div>
</div>


</body>
</html>
