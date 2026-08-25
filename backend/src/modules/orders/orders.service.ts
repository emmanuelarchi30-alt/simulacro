import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

/** Forma plana que consume el frontend. */
export interface OrderResponse {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    image: string | null;
  };
  buyer?: { id: string; name: string };
}

const MAX_QUANTITY = 10;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Compra directa (1 producto por orden). Transaccional:
   * valida stock, lo descuenta y registra la orden con el precio congelado.
   */
  async create(userId: string, dto: CreateOrderDto): Promise<OrderResponse> {
    if (dto.quantity < 1 || dto.quantity > MAX_QUANTITY) {
      throw new BadRequestException(
        `La cantidad debe estar entre 1 y ${MAX_QUANTITY}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }
      if (product.stock < dto.quantity) {
        throw new BadRequestException(
          `Stock insuficiente: solo quedan ${product.stock} unidades`,
        );
      }

      product.stock -= dto.quantity;
      await manager.save(Product, product);

      const order = manager.create(Order, {
        userId,
        productId: product.id,
        quantity: dto.quantity,
        unitPrice: product.price,
        totalPrice: Number((product.price * dto.quantity).toFixed(2)),
        status: 'completada',
      });
      const saved = await manager.save(Order, order);
      // El producto eager viene sin recargar; adjuntamos el que ya tenemos.
      saved.product = product;
      return OrdersService.toResponse(saved);
    });
  }

  /** Historial de compras del usuario autenticado. */
  async findMyOrders(userId: string): Promise<OrderResponse[]> {
    const orders = await this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    // product es eager: ya viene cargado en cada orden.
    return orders.map((order) => OrdersService.toResponse(order));
  }

  /** Listado completo para administradores. */
  async findAll(): Promise<OrderResponse[]> {
    const orders = await this.ordersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return orders.map((order) =>
      OrdersService.toResponse(order, {
        id: order.user?.id,
        name: order.user?.name,
      }),
    );
  }

  static toResponse(order: Order, buyer?: { id?: string; name?: string }): OrderResponse {
    return {
      id: order.id,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      product: {
        id: order.product.id,
        name: order.product.name,
        image: order.product.images[0]?.url ?? null,
      },
      ...(buyer && buyer.id ? { buyer: { id: buyer.id!, name: buyer.name ?? '' } } : {}),
    };
  }
}
