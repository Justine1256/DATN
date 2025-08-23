"use client";

import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Đang tải trang thành công...</div>}>
            <CheckoutSuccessContent />
        </Suspense>
    );
}
