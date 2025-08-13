<?php

namespace App\Http\Controllers;

use App\Models\ShopPaymentAccount;
use Illuminate\Http\Request;

class PaymentAccountController extends Controller
{
    public function index($shopId)
    {
        return ShopPaymentAccount::where('shop_id', $shopId)->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'gateway' => 'required|string',
            'config' => 'required|array',
            'status' => 'in:active,inactive'
        ]);

        return ShopPaymentAccount::create($data);
    }

    public function update(Request $request, $id)
    {
        $account = ShopPaymentAccount::findOrFail($id);

        $account->update($request->only(['config', 'status']));

        return $account;
    }

    public function destroy($id)
    {
        $account = ShopPaymentAccount::findOrFail($id);
        $account->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
