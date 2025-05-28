<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    public function index()
    {
        $addresses = Address::where('user_id', Auth::id())->get();
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'   => 'required|string|max:255',
            'phone'       => 'required|string|max:20',
            'address'     => 'required|string|max:255',
            'ward'        => 'required|string|max:100',
            'district'    => 'required|string|max:100',
            'city'        => 'required|string|max:100',
            'province'    => 'required|string|max:100',
            'note'        => 'nullable|string|max:1000',
            'is_default'  => 'nullable|boolean',
        ]);

        $validated['user_id'] = Auth::id();

        // Kiểm tra nếu user chưa có địa chỉ nào thì gán mặc định là true
        $hasAddress = Address::where('user_id', Auth::id())->exists();

        if (!$hasAddress) {
            $validated['is_default'] = true;
        } elseif (!empty($validated['is_default'])) {
            // Nếu người dùng chọn địa chỉ mới là mặc định thì reset các địa chỉ khác
            Address::where('user_id', Auth::id())->update(['is_default' => false]);
        } else {
            $validated['is_default'] = false;
        }

        $address = Address::create($validated);

        return response()->json([
            'message' => 'Đã thêm địa chỉ thành công',
            'address' => $address
        ], 201);
    }
    public function update(Request $request, $id)
    {
        $address = Address::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'full_name'   => 'required|string|max:255',
            'phone'       => 'required|string|max:20',
            'address'     => 'required|string|max:255',
            'ward'        => 'required|string|max:100',
            'district'    => 'required|string|max:100',
            'city'        => 'required|string|max:100',
            'province'    => 'required|string|max:100',
            'note'        => 'nullable|string|max:1000',
            'is_default'  => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            Address::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'message' => 'Cập nhật địa chỉ thành công',
            'address' => $address
        ]);
    }

    public function destroy($id)
    {
        $address = Address::where('user_id', Auth::id())->findOrFail($id);
        $address->delete();

        return response()->json(['message' => 'Đã xóa địa chỉ thành công']);
    }
}
