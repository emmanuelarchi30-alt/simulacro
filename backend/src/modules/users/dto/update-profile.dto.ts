import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ana Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/fotos/perfil.jpg',
    description: 'URL de la foto de perfil; enviar null para quitarla',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  avatar?: string | null;
}
