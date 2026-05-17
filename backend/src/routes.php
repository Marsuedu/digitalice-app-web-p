<?php

declare(strict_types=1);

use DigitalIce\Controllers\AuthController;
use DigitalIce\Controllers\DashboardController;
use DigitalIce\Controllers\DocenteController;
use DigitalIce\Controllers\EstudianteController;
use DigitalIce\Controllers\InscripcionController;
use DigitalIce\Controllers\NotaController;
use DigitalIce\Controllers\PagoController;
use DigitalIce\Controllers\ProductoAcademicoController;
use DigitalIce\Controllers\ReporteController;
use DigitalIce\Middlewares\AuthMiddleware;
use DigitalIce\Middlewares\RoleMiddleware;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return static function (App $app): void {
    $app->get('/api/health', fn ($request, $response) => \DigitalIce\Helpers\ResponseHelper::success($response, [
        'service' => 'digitalice-api',
        'status' => 'ok',
    ]));

    $app->post('/api/auth/login', [new AuthController(), 'login']);
    $app->post('/api/auth/logout', [new AuthController(), 'logout'])->add(new AuthMiddleware());
    $app->get('/api/auth/me', [new AuthController(), 'me'])->add(new AuthMiddleware());
    $app->patch('/api/auth/me', [new AuthController(), 'updateMe'])->add(new AuthMiddleware());

    $app->group('/api', function (RouteCollectorProxy $group): void {
        $group->get('/dashboard', [new DashboardController(), 'index']);

        $group->get('/productos-academicos', [new ProductoAcademicoController(), 'index'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->post('/productos-academicos', [new ProductoAcademicoController(), 'store'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->get('/productos-academicos/{id}', [new ProductoAcademicoController(), 'show'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->patch('/productos-academicos/{id}', [new ProductoAcademicoController(), 'update'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->delete('/productos-academicos/{id}', [new ProductoAcademicoController(), 'destroy'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->post('/productos-academicos/{id}/modulos', [new ProductoAcademicoController(), 'addModule'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->patch('/productos-academicos/{id}/modulos/{module_id}', [new ProductoAcademicoController(), 'updateModule'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->delete('/productos-academicos/{id}/modulos/{module_id}', [new ProductoAcademicoController(), 'deleteModule'])->add(new RoleMiddleware(['Admin', 'Coordinador']));

        $group->get('/estudiantes', [new EstudianteController(), 'index'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->post('/estudiantes', [new EstudianteController(), 'store'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->get('/estudiantes/{id}', [new EstudianteController(), 'show'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->patch('/estudiantes/{id}', [new EstudianteController(), 'update'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->delete('/estudiantes/{id}', [new EstudianteController(), 'destroy'])->add(new RoleMiddleware(['Admin', 'Coordinador']));

        $group->get('/docentes', [new DocenteController(), 'index'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->post('/docentes', [new DocenteController(), 'store'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->get('/docentes/{id}', [new DocenteController(), 'show'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->patch('/docentes/{id}', [new DocenteController(), 'update'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->delete('/docentes/{id}', [new DocenteController(), 'destroy'])->add(new RoleMiddleware(['Admin', 'Coordinador']));

        $group->get('/inscripciones', [new InscripcionController(), 'index'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->post('/inscripciones', [new InscripcionController(), 'store'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->get('/inscripciones/{id}', [new InscripcionController(), 'show'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->patch('/inscripciones/{id}', [new InscripcionController(), 'update'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->delete('/inscripciones/{id}', [new InscripcionController(), 'destroy'])->add(new RoleMiddleware(['Admin']));
        $group->get('/inscripciones/{id}/modulos', [new InscripcionController(), 'modules'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->patch('/inscripcion-modulos/{id}/docente', [new InscripcionController(), 'assignTeacher'])->add(new RoleMiddleware(['Admin', 'Coordinador']));

        $group->get('/notas/cursos', [new NotaController(), 'courses'])->add(new RoleMiddleware(['Admin', 'Coordinador', 'Docente']));
        $group->get('/notas/cursos/{producto_modulo_id}/alumnos', [new NotaController(), 'students'])->add(new RoleMiddleware(['Admin', 'Coordinador', 'Docente']));
        $group->post('/notas', [new NotaController(), 'store'])->add(new RoleMiddleware(['Admin', 'Coordinador', 'Docente']));
        $group->patch('/notas/{id}', [new NotaController(), 'update'])->add(new RoleMiddleware(['Admin']));

        $group->get('/reportes/matriculados', [new ReporteController(), 'enrolledStudents'])->add(new RoleMiddleware(['Admin', 'Coordinador']));

        $group->get('/pagos/inscripcion/{inscripcion_id}', [new PagoController(), 'byInscription'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->post('/pagos/{id}/registrar', [new PagoController(), 'register'])->add(new RoleMiddleware(['Admin', 'Coordinador']));
        $group->delete('/pagos/{id}', [new PagoController(), 'destroy'])->add(new RoleMiddleware(['Admin']));
    })->add(new AuthMiddleware());
};
