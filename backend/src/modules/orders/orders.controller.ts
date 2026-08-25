import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Comprar un producto (requiere JWT). Descuenta stock.' })
  purchase(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(currentUser.sub, dto);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Mis compras (requiere JWT)' })
  myOrders(@CurrentUser() currentUser: JwtPayload) {
    return this.ordersService.findMyOrders(currentUser.sub);
  }

  @Get()
  @Auth(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Todas las órdenes con comprador (requiere rol admin)',
  })
  @ApiOkResponse({})
  findAll() {
    return this.ordersService.findAll();
  }
}
