<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Services\ReporteService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ReporteController
{
    public function __construct(private ReporteService $service = new ReporteService())
    {
    }

    public function enrolledStudents(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->service->enrolledStudents());
    }
}
