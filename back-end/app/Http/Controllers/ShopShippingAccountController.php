<?php

namespace App\Http\Controllers;

use App\Models\ShopShippingAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ShopShippingAccountController extends Controller
{
    // Lấy danh sách tài khoản vận chuyển của shop
    public function index()
    {
        $shopId = Auth::user()->shop->id;

        return ShopShippingAccount::where('shop_id', $shopId)->get();
    }

    // Thêm mới
    public function store(Request $request)
    {
        $shopId = Auth::user()->shop->id;

        $data = $request->validate([
            'provider' => 'required|in:GHN,GHTK,VNPOST,J&T,NINJAVAN',
            'provider_shop_id' => 'required|string|max:50',
            'api_token' => 'required|string',
            'province_id' => 'nullable|integer',
            'ward_code' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'in:active,inactive'
        ]);

        $data['shop_id'] = $shopId;

        $account = ShopShippingAccount::create($data);

        return response()->json($account, 201);
    }

    // Cập nhật
    public function update(Request $request, $id)
    {
        $shopId = Auth::user()->shop->id;

        $account = ShopShippingAccount::where('shop_id', $shopId)->findOrFail($id);

        $data = $request->validate([
            'provider_shop_id' => 'sometimes|string|max:50',
            'api_token' => 'sometimes|string',
            'province_id' => 'nullable|integer',
            'ward_code' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'in:active,inactive'
        ]);

        $account->update($data);

        return response()->json($account);
    }

    // Xóa
    public function destroy($id)
    {
        $shopId = Auth::user()->shop->id;

        $account = ShopShippingAccount::where('shop_id', $shopId)->findOrFail($id);

        $account->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
