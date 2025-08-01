<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class ResetUserReportViolations extends Command
{
    protected $signature = 'users:reset-report-violations';
    protected $description = 'Reset số vi phạm tố cáo sai hàng tháng';

    public function handle()
    {
        $count = User::where('report_violations', '>', 0)->update([
            'report_violations' => 0,
            'is_report_blocked' => false,
        ]);

        $this->info("Đã reset vi phạm tố cáo cho {$count} user.");
    }
}
