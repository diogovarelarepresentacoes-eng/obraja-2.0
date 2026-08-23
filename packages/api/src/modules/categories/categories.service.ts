import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(parentId?: string) {
    const where = parentId ? { parentId } : { parentId: null };
    return this.prisma.category.findMany({
      where: { ...where, isActive: true },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findTree() {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return roots;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: { where: { isActive: true } }, parent: true },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug já utilizado');

    return this.prisma.category.create({ data: dto });
  }

  async seedDefaults() {
    const categories = [
      { name: 'Estrutura', slug: 'estrutura', sortOrder: 1, children: [
        { name: 'Cimento e Argamassa', slug: 'cimento-argamassa', sortOrder: 1 },
        { name: 'Tijolos e Blocos', slug: 'tijolos-blocos', sortOrder: 2 },
        { name: 'Vergalhões e Aço', slug: 'vergalhoes-aco', sortOrder: 3 },
        { name: 'Concreto Usinado', slug: 'concreto-usinado', sortOrder: 4 },
      ]},
      { name: 'Revestimento', slug: 'revestimento', sortOrder: 2, children: [
        { name: 'Cerâmica e Porcelanato', slug: 'ceramica-porcelanato', sortOrder: 1 },
        { name: 'Tinta e Textura', slug: 'tinta-textura', sortOrder: 2 },
        { name: 'Pedra e Granito', slug: 'pedra-granito', sortOrder: 3 },
      ]},
      { name: 'Hidráulica', slug: 'hidraulica', sortOrder: 3, children: [
        { name: 'Tubos e Conexões', slug: 'tubos-conexoes', sortOrder: 1 },
        { name: 'Caixas d\'água', slug: 'caixas-dagua', sortOrder: 2 },
        { name: 'Registros e Válvulas', slug: 'registros-valvulas', sortOrder: 3 },
      ]},
      { name: 'Elétrica', slug: 'eletrica', sortOrder: 4, children: [
        { name: 'Fios e Cabos', slug: 'fios-cabos', sortOrder: 1 },
        { name: 'Quadros Elétricos', slug: 'quadros-eletricos', sortOrder: 2 },
        { name: 'Tomadas e Interruptores', slug: 'tomadas-interruptores', sortOrder: 3 },
      ]},
      { name: 'Ferramentas', slug: 'ferramentas', sortOrder: 5, children: [
        { name: 'Ferramentas Manuais', slug: 'ferramentas-manuais', sortOrder: 1 },
        { name: 'Ferramentas Elétricas', slug: 'ferramentas-eletricas', sortOrder: 2 },
        { name: 'EPI e Segurança', slug: 'epi-seguranca', sortOrder: 3 },
      ]},
      { name: 'Acabamento', slug: 'acabamento', sortOrder: 6, children: [
        { name: 'Portas e Janelas', slug: 'portas-janelas', sortOrder: 1 },
        { name: 'Pisos Externos', slug: 'pisos-externos', sortOrder: 2 },
        { name: 'Gesso e Drywall', slug: 'gesso-drywall', sortOrder: 3 },
      ]},
    ];

    for (const cat of categories) {
      const existing = await this.prisma.category.findUnique({ where: { slug: cat.slug } });
      if (!existing) {
        const { children, ...catData } = cat;
        const parent = await this.prisma.category.create({ data: catData });
        for (const child of children) {
          const childExists = await this.prisma.category.findUnique({ where: { slug: child.slug } });
          if (!childExists) {
            await this.prisma.category.create({ data: { ...child, parentId: parent.id } });
          }
        }
      }
    }

    return { message: 'Categorias padrão criadas com sucesso' };
  }
}
