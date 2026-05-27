<?php

declare(strict_types=1);

use DigitalIce\Config\AppConfig;
use DigitalIce\Middlewares\CorsMiddleware;
use DigitalIce\Middlewares\JsonBodyMiddleware;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

AppConfig::loadEnv(__DIR__ . '/../.env');
AppConfig::startSession();

$app = AppFactory::create();

/*
|--------------------------------------------------------------------------
| CORS PRIMERO
|--------------------------------------------------------------------------
*/
$app->add(new CorsMiddleware());

/*
|--------------------------------------------------------------------------
| ROUTING
|--------------------------------------------------------------------------
*/
$app->addRoutingMiddleware();

/*
|--------------------------------------------------------------------------
| OPTIONS PRE-FLIGHT
|--------------------------------------------------------------------------
*/
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

/*
|--------------------------------------------------------------------------
| JSON BODY
|--------------------------------------------------------------------------
*/
$app->add(new JsonBodyMiddleware());

/*
|--------------------------------------------------------------------------
| ERRORS
|--------------------------------------------------------------------------
*/
$app->addErrorMiddleware(true, true, true);

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/
(require __DIR__ . '/../src/routes.php')($app);

$app->run();
