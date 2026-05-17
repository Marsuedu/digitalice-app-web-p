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
$app->addRoutingMiddleware();
$app->add(new CorsMiddleware());
$app->add(new JsonBodyMiddleware());
$app->addErrorMiddleware(AppConfig::debug(), true, true);

(require __DIR__ . '/../src/routes.php')($app);

$app->run();

