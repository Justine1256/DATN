<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Shop;
use Carbon\Carbon;

class UnlockShops extends Command
{
    protected $signature = 'shops:unlock';
    protected $description = 'Mở lại các shop đã hết thời gian khóa';

    public function handle()
    {
        $shops = Shop::where('status', 'hidden')
            ->whereNotNull('locked_until')
            ->where('locked_until', '<=', Carbon::now())
            ->get();

        foreach ($shops as $shop) {
            $shop->status = 'activated';
            $shop->locked_until = null;
            $shop->report_warnings = 0; // reset nếu muốn
            $shop->save();

            // Gửi thông báo mở lại
            \App\Models\Notification::create([
                'user_id' => $shop->user_id,
                'title' => 'Shop đã được mở lại',
                'content' => 'Shop của bạn đã được tự động mở lại sau thời gian khóa 7 ngày.',
                'is_read' => 0,
            ]);
        }

        $this->info("Đã mở lại " . count($shops) . " shop.");
    }
}
