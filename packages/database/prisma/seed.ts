import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
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
    { name: 'Piso Laminado', slug: 'piso-laminado', sortOrder: 4 },
  ]},
  { name: 'Hidráulica', slug: 'hidraulica', sortOrder: 3, children: [
    { name: 'Tubos e Conexões', slug: 'tubos-conexoes', sortOrder: 1 },
    { name: 'Caixas d\'água', slug: 'caixas-dagua', sortOrder: 2 },
    { name: 'Registros e Válvulas', slug: 'registros-valvulas', sortOrder: 3 },
    { name: 'Louças e Metais', slug: 'loucas-metais', sortOrder: 4 },
  ]},
  { name: 'Elétrica', slug: 'eletrica', sortOrder: 4, children: [
    { name: 'Fios e Cabos', slug: 'fios-cabos', sortOrder: 1 },
    { name: 'Quadros Elétricos', slug: 'quadros-eletricos', sortOrder: 2 },
    { name: 'Tomadas e Interruptores', slug: 'tomadas-interruptores', sortOrder: 3 },
    { name: 'Iluminação', slug: 'iluminacao', sortOrder: 4 },
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
    { name: 'Impermeabilização', slug: 'impermeabilizacao', sortOrder: 4 },
  ]},
  { name: 'Madeira e Estruturas', slug: 'madeira-estruturas', sortOrder: 7, children: [
    { name: 'Madeiramento', slug: 'madeiramento', sortOrder: 1 },
    { name: 'MDF e MDP', slug: 'mdf-mdp', sortOrder: 2 },
    { name: 'Andaimes e Escoramentos', slug: 'andaimes-escoramentos', sortOrder: 3 },
  ]},
];

async function main() {
  console.log('Seeding categories...');

  for (const cat of CATEGORIES) {
    const { children, ...catData } = cat;
    const parent = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {},
      create: catData,
    });

    for (const child of children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: { ...child, parentId: parent.id },
      });
    }
  }

  console.log(`✅ ${CATEGORIES.length} categorias raiz + subcategorias criadas`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
