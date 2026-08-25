import { MigrationInterface, QueryRunner } from 'typeorm';

const U = 'https://images.unsplash.com/';

/**
 * 1) Tabla de órdenes de compra (compra directa: 1 producto por orden).
 * 2) Corrige las imágenes de los productos semilla (picsum mostraba paisajes
 *    aleatorios que no coincidían con el producto).
 * 3) Amplía el catálogo a 16 productos con imágenes acordes a su nombre.
 */
export class CreateOrdersAndFixCatalog1791000000000 implements MigrationInterface {
  name = 'CreateOrdersAndFixCatalog1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "unit_price" numeric(10,2) NOT NULL,
        "total_price" numeric(10,2) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'completada',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")`,
    );

    // --- Imágenes reales para los 5 productos originales ---
    const imageFixes: Array<[string, string]> = [
      ['Mancuernas ajustables 20kg', `${U}photo-1534438327276-14e5300c3a48?w=640&h=480&fit=crop&q=80`],
      ['Audífonos inalámbricos XT200', `${U}photo-1505740420928-5e560c06d30e?w=640&h=480&fit=crop&q=80`],
      ['Teclado mecánico RGB', `${U}photo-1587829741301-dc798b83add3?w=640&h=480&fit=crop&q=80`],
      ['Monitor 27 QHD', `${U}photo-1527443224154-c4a3942d3acf?w=640&h=480&fit=crop&q=80`],
      ['Set de sartenes antiadherentes', `${U}photo-1556909114-f6e7ad7d3136?w=640&h=480&fit=crop&q=80`],
    ];
    for (const [name, url] of imageFixes) {
      await queryRunner.query(
        `UPDATE product_images pi SET url = $1
           FROM products p
          WHERE pi.product_id = p.id AND p.name = $2`,
        [url, name],
      );
    }

    // --- Catálogo ampliado: 11 productos más (4 por categoría aprox.) ---
    const newProducts: Array<{
      name: string;
      category: string;
      description: string;
      price: number;
      stock: number;
      image: string;
    }> = [
      {
        name: 'Smartphone Galaxy A54 5G',
        category: 'Electrónica',
        description:
          'Teléfono inteligente con pantalla AMOLED de 6.4", 128 GB y cámara triple de 50 MP.',
        price: 1299900,
        stock: 20,
        image: `${U}photo-1511707171634-5f897ff02aa9?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Cafetera Espresso 20 Bares',
        category: 'Hogar',
        description:
          'Cafetera con bomba italiana de 20 bares, vaporizador para leche y depósito de 1.5 L.',
        price: 459900,
        stock: 10,
        image: `${U}photo-1495474472287-4d71bcdd2085?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Juego de Sábanas Queen 400 Hilos',
        category: 'Hogar',
        description:
          'Juego de sábanas en microfibra premium, suave y fresco. Incluye dos fundas de almohada.',
        price: 99900,
        stock: 25,
        image: `${U}photo-1505693416388-ac5ce068fe85?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Lámpara de Escritorio LED Regulable',
        category: 'Hogar',
        description:
          'Lámpara LED con 3 temperaturas de color, brillo regulable y puerto USB de carga.',
        price: 74900,
        stock: 22,
        image: `${U}photo-1507473885765-e6ed057f782c?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Camiseta de Fútbol Local Talla M',
        category: 'Deportes',
        description:
          'Camiseta oficial de fútbol en tela transpirable Dry-Fit, talla M.',
        price: 89900,
        stock: 35,
        image: `${U}photo-1552318965-6e6be7484ada?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Zapatillas de Running AirFlow',
        category: 'Deportes',
        description:
          'Zapatillas ligeras con amortiguación de espuma y malla respirable para entrenamiento diario.',
        price: 289900,
        stock: 16,
        image: `${U}photo-1552674605-db6ffd4facb5?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Balón de Baloncesto Pro Tamaño 7',
        category: 'Deportes',
        description:
          'Balón de cuero compuesto para uso interior y exterior, con agarre mejorado.',
        price: 94900,
        stock: 20,
        image: `${U}photo-1546519638-68e109498ffc?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Cien Años de Soledad',
        category: 'Libros',
        description:
          'La obra maestra de Gabriel García Márquez en edición de tapa dura.',
        price: 49900,
        stock: 28,
        image: `${U}photo-1544947950-fa07a98d237f?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'El Principito',
        category: 'Libros',
        description:
          'El clásico de Antoine de Saint-Exupéry con sus ilustraciones originales.',
        price: 34900,
        stock: 30,
        image: `${U}photo-1512820790803-83ca734da794?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Clean Code',
        category: 'Libros',
        description:
          'Robert C. Martin: la guía esencial para escribir código limpio y mantenible.',
        price: 69900,
        stock: 15,
        image: `${U}photo-1517694712202-14dd9538aa97?w=640&h=480&fit=crop&q=80`,
      },
      {
        name: 'Steve Jobs: La Biografía',
        category: 'Libros',
        description: 'Biografía autorizada escrita por Walter Isaacson.',
        price: 59900,
        stock: 12,
        image: `${U}photo-1471107340929-a87cd0f5b5f3?w=640&h=480&fit=crop&q=80`,
      },
    ];

    for (const p of newProducts) {
      // Idempotente: no duplica si el nombre ya existe (name es UNIQUE).
      const inserted = await queryRunner.query(
        `INSERT INTO products (name, description, price, stock, category_id)
         SELECT $1::varchar, $2::text, $3::numeric, $4::int, c.id
           FROM categories c
          WHERE c.name = $5::varchar
            AND NOT EXISTS (SELECT 1 FROM products WHERE name = $1::varchar)
          RETURNING id`,
        [p.name, p.description, p.price, p.stock, p.category],
      );
      if (inserted.length > 0) {
        await queryRunner.query(
          `INSERT INTO product_images (url, product_id) VALUES ($1, $2)`,
          [p.image, inserted[0].id],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const addedNames = [
      'Smartphone Galaxy A54 5G',
      'Cafetera Espresso 20 Bares',
      'Juego de Sábanas Queen 400 Hilos',
      'Lámpara de Escritorio LED Regulable',
      'Camiseta de Fútbol Local Talla M',
      'Zapatillas de Running AirFlow',
      'Balón de Baloncesto Pro Tamaño 7',
      'Cien Años de Soledad',
      'El Principito',
      'Clean Code',
      'Steve Jobs: La Biografía',
    ];
    await queryRunner.query(`DELETE FROM products WHERE name = ANY($1)`, [
      addedNames,
    ]);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
  }
}
