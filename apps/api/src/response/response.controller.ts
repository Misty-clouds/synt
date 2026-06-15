import { Controller, Param, Post } from '@nestjs/common';
import { ResponseService } from './response.service';

@Controller('investigations/:id/actions/:actionId')
export class ResponseController {
  constructor(private readonly response: ResponseService) {}

  @Post('approve')
  approve(@Param('id') id: string, @Param('actionId') actionId: string) {
    return this.response.approve(id, actionId);
  }

  @Post('reject')
  reject(@Param('id') id: string, @Param('actionId') actionId: string) {
    return this.response.reject(id, actionId);
  }
}
