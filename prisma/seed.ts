import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default sections
  const sections = [
    {
      title: 'Web2 Security',
      description: '전통적인 웹 보안 및 시스템 해킹',
      order: 1,
    },
    {
      title: 'Web3 Security',
      description: '블록체인 및 스마트 컨트랙트 보안',
      order: 2,
    },
    {
      title: 'TIL',
      description: 'Today I Learned - 오늘 배운 것들',
      order: 3,
    },
  ];

  for (const section of sections) {
    const existing = await prisma.section.findFirst({
      where: { title: section.title },
    });

    if (!existing) {
      await prisma.section.create({
        data: section,
      });
      console.log(`Created section: ${section.title}`);
    } else {
      console.log(`Section already exists: ${section.title}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
