import { BadRequestException, Controller, Get, Param, Post } from '@nestjs/common';
import { scenarioList } from '@synt/scenarios';
import { SCENARIO_IDS, type ScenarioId } from '@synt/shared';
import { TriggerService } from './trigger.service';

@Controller()
export class TriggerController {
  constructor(private readonly trigger: TriggerService) {}

  @Get('scenarios')
  list() {
    return scenarioList.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      indexes: s.indexes,
      severity: s.triggerSignal.severity,
      mitre: s.groundTruth.mitre,
    }));
  }

  @Post('scenarios/:id/inject')
  async inject(@Param('id') id: string) {
    if (!SCENARIO_IDS.includes(id as ScenarioId)) {
      throw new BadRequestException(`Unknown scenario "${id}". Valid: ${SCENARIO_IDS.join(', ')}`);
    }
    return this.trigger.inject(id as ScenarioId);
  }
}
