<?php

declare(strict_types=1);

namespace DigitalIce\Tests\Unit;

use PHPUnit\Framework\TestCase;

final class NotaRulesTest extends TestCase
{
    public function testPassingGradeIsApproved(): void
    {
        $this->assertSame('APROBADO', $this->gradeStatus(60));
        $this->assertSame('APROBADO', $this->gradeStatus(95));
    }

    public function testFailingGradeIsRejected(): void
    {
        $this->assertSame('REPROBADO', $this->gradeStatus(59));
    }

    private function gradeStatus(int $grade): string
    {
        return $grade >= 60 ? 'APROBADO' : 'REPROBADO';
    }
}

