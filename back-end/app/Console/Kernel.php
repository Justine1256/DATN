<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('shops:unlock')->daily();
        $schedule->command('users:reset-report-violations')->monthly();
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
    }

}
