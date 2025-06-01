
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, // quan trọng
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
