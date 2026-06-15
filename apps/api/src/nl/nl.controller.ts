import { Body, Controller, Param, Post } from '@nestjs/common';
import { NlService } from './nl.service';

@Controller('investigations/:id/command')
export class NlController {
  constructor(private readonly nl: NlService) {}

  @Post()
  command(@Param('id') id: string, @Body('text') text: string) {
    return this.nl.command(id, text ?? '');
  }
}
