<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\VnpayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function create(Request $req)
    {
        $data = $req->validate([
            'amount'    => 'required|integer|min:1000',
            'orderId'   => 'nullable|string',
            'orderInfo' => 'nullable|string',
        ]);

        $url = VnpayService::createPaymentUrl(
            (int)$data['amount'],
            $data['orderId'] ?? null,
            $data['orderInfo'] ?? null
        );

        return response()->json([
            'payment_url' => $url,
        ]);
    }

    /**
     * Helper: tách danh sách order_id từ TxnRef.
     * Hỗ trợ các dạng:
     * - ORD_1_2_3  -> [1,2,3]
     * - ORD-4-5    -> [4,5]
     * - "12345"    -> [12345]
     */
    private function extractOrderIdsFromTxnRef(?string $txnRef): array
    {
        if (!$txnRef) return [];
        if (preg_match('/^ORD[_-](.+)$/i', $txnRef, $m) && !empty($m[1])) {
            return array_values(array_filter(preg_split('/[_-]/', $m[1])));
        }
        if (ctype_digit($txnRef)) {
            return [$txnRef];
        }
        return [];
    }

    // GET /api/vnpay/return
    public function return(Request $req)
    {
        $params = $req->query();
        $ok     = VnpayService::verify($params);
        $code   = $params['vnp_ResponseCode'] ?? null;       // "00" => success
        $txnRef = $params['vnp_TxnRef'] ?? null;             // VD: ORD_1_2_3
        $vnpTxn = $params['vnp_TransactionNo'] ?? null;      // Mã GD VNPay
        $bank   = $params['vnp_BankCode'] ?? null;
        $payAt  = $params['vnp_PayDate'] ?? null;
        $amount = isset($params['vnp_Amount']) ? (int) round(((int)$params['vnp_Amount']) / 100) : null;

        $orderIds = $this->extractOrderIdsFromTxnRef($txnRef);

        try {
            DB::beginTransaction();

            if ($ok && $code === '00') {
                // Thành công: chốt thanh toán
                Order::whereIn('id', $orderIds)
                    ->where('payment_method', 'vnpay')
                    ->update([
                        'payment_status'        => 'Completed',
                        'order_status'          => 'order confirmation',
                        'order_admin_status'    => 'Paid – Reconciliation Pending',
                        'transaction_id'        => $vnpTxn,
                        'confirmed_at'          => now(),
                        'reconciliation_status' => 'Pending',
                        'updated_at'            => now(),
                    ]);
            } else {
                // Chưa hoàn tất / thất bại
                Order::whereIn('id', $orderIds)
                    ->where('payment_method', 'vnpay')
                    ->where('payment_status', 'Pending')
                    ->update([
                        'payment_status'     => 'Failed',
                        'order_admin_status' => 'Cancelled – Payment Failed',
                        'canceled_at'        => now(),
                        'canceled_by'        => 'Payment Gateway',
                        'updated_at'         => now(),
                    ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('VNP return update error: '.$e->getMessage(), ['params' => $params, 'orders' => $orderIds]);
            return response()->json([
                'verified' => $ok,
                'success'  => false,
                'error'    => 'DB_UPDATE_FAILED',
            ], 500);
        }

        // Phản hồi cho FE
        return response()->json([
            'verified'         => $ok,
            'success'          => $ok && $code === '00',
            'vnp_ResponseCode' => $code,
            'order_id'         => $txnRef,
            'order_ids'        => $orderIds,
            'transaction_no'   => $vnpTxn,
            'amount'           => $amount,
            'bank_code'        => $bank,
            'pay_date'         => $payAt,
        ], $ok ? 200 : 400);
    }

    // POST /api/vnpay/ipn (khuyến nghị dùng để chốt trạng thái)
    public function ipn(Request $req)
    {
        $params = $req->all();
        $ok     = VnpayService::verify($params);
        $code   = $params['vnp_ResponseCode'] ?? null;
        $txnRef = $params['vnp_TxnRef'] ?? null;
        $vnpTxn = $params['vnp_TransactionNo'] ?? null;
        $bank   = $params['vnp_BankCode'] ?? null;
        $payAt  = $params['vnp_PayDate'] ?? null;
        $amount = isset($params['vnp_Amount']) ? (int) round(((int)$params['vnp_Amount']) / 100) : null;

        $orderIds = $this->extractOrderIdsFromTxnRef($txnRef);

        try {
            DB::beginTransaction();

            if ($ok && $code === '00') {
                Order::whereIn('id', $orderIds)
                    ->where('payment_method', 'vnpay')
                    ->update([
                        'payment_status'        => 'Completed',
                        'order_status'          => 'order confirmation',
                        'order_admin_status'    => 'Paid – Reconciliation Pending',
                        'transaction_id'        => $vnpTxn,
                        'confirmed_at'          => now(),
                        'reconciliation_status' => 'Pending',
                        'updated_at'            => now(),
                    ]);

                DB::commit();
                // Chuẩn VNPay: trả "00" nếu đã ghi nhận
                return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
            } else {
                // checksum sai hoặc giao dịch chưa completed
                DB::commit(); // không đổi trạng thái, vẫn phản hồi theo chuẩn
                return response()->json(['RspCode' => $ok ? '24' : '97', 'Message' => $ok ? 'Transaction Not Completed' : 'Invalid Checksum']);
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('VNP ipn update error: '.$e->getMessage(), ['params' => $params, 'orders' => $orderIds]);
            return response()->json(['RspCode' => '99', 'Message' => 'System Error']);
        }
    }
}
