import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");
  await prisma.notification.deleteMany();
  await prisma.pointsHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.shopItem.deleteMany();
  await prisma.level.deleteMany();
  await prisma.user.deleteMany();

  // ─── Пользователи ───
  const userPwd = await bcrypt.hash("password123", 10);
  const adminPwd = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.create({
    data: {
      email: "user@tpu.ru",
      passwordHash: userPwd,
      firstName: "Иван",
      lastName: "Петров",
      middleName: "Сергеевич",
      username: "ivanPetrov",
      role: "USER",
      group: "8К32",
      faculty: "ИНК",
      totalPoints: 280,
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: "admin@tpu.ru",
      passwordHash: adminPwd,
      firstName: "Администратор",
      lastName: "Системы",
      username: "admin",
      role: "ADMIN",
      totalPoints: 0,
    },
  });
  console.log(`  ✓ users: ${user.email}, ${admin.email}`);

  // ─── Мероприятия (расширенные поля) ───
  const events = [
    {
      id: 1,
      title: "Межфакультетский кубок по футболу",
      description: "Ежегодный турнир сборных факультетов. Формат — 11×11.",
      fullDescription:
        "Межфакультетский кубок по футболу — традиционное соревнование среди студентов. Турнир проводится по системе плей-офф с групповым этапом. Каждая команда состоит из 11 игроков основного состава и до 7 запасных.",
      eventType: "sport",
      category: "Футбол",
      status: "published",
      startDate: new Date("2026-05-15T15:00:00.000Z"),
      endDate: new Date("2026-05-15T18:00:00.000Z"),
      registrationDeadline: new Date("2026-05-10T23:59:59.000Z"),
      participantPoints: 150,
      fanPoints: 30,
      maxParticipants: 200,
      location: "Стадион «Политехник»",
      address: "ул. Спортивная, 15",
      contactEmail: "sport@university.ru",
      contactPhone: "+7 (999) 123-45-67",
      duration: "8 часов",
      level: "Любительский",
      format: "11x11, групповой + плей-офф",
      rules: "Игра по правилам ФИФА. 2 тайма по 35 минут.",
      equipment: "Мяч размера 5, щитки обязательны",
      requirements: "Спортивная форма, медицинский допуск",
    },
    {
      id: 2,
      title: "Стритболный марафон 3x3",
      description: "Уличный баскетбол 3×3.",
      fullDescription:
        "Стритбольный марафон — энергичный турнир в формате уличного спорта.",
      eventType: "sport",
      category: "Баскетбол",
      status: "published",
      startDate: new Date("2026-06-01T12:00:00.000Z"),
      endDate: new Date("2026-06-01T16:00:00.000Z"),
      registrationDeadline: new Date("2026-05-28T23:59:59.000Z"),
      participantPoints: 100,
      fanPoints: 25,
      maxParticipants: 80,
      location: "Открытая площадка М2",
      address: "ул. Молодёжная, 8",
      contactEmail: "basket@university.ru",
      contactPhone: "+7 (999) 234-56-78",
      duration: "8 часов",
      level: "Любительский",
      format: "3x3, олимпийская система",
      rules: "Правила FIBA 3x3. Матч до 21 очка.",
      equipment: "Мяч размера 6",
      requirements: "Спортивная форма, баскетбольная обувь",
    },
    {
      id: 3,
      title: "Ночная лига волейбола",
      description: "Серия ночных матчей по волейболу 6×6.",
      fullDescription:
        "Ночная лига волейбола — уникальное событие для любителей.",
      eventType: "sport",
      category: "Волейбол",
      status: "published",
      startDate: new Date("2026-06-20T19:00:00.000Z"),
      endDate: new Date("2026-06-20T22:00:00.000Z"),
      registrationDeadline: new Date("2026-06-15T23:59:59.000Z"),
      participantPoints: 120,
      fanPoints: 40,
      maxParticipants: 100,
      location: "Спорткомплекс «Здоровье»",
      address: "пр. Спортивный, 25",
      contactEmail: "volley@university.ru",
      contactPhone: "+7 (999) 345-67-89",
      duration: "6 часов",
      level: "Средний",
      format: "6x6, круговая + плей-офф",
      rules: "Матч до 3 сетов по 25 очков.",
      equipment: "Мячи предоставляются",
      requirements: "Спортивная форма, наколенники",
    },
    {
      id: 4,
      title: "Заплыв «Буревестник»",
      description: "Соревнования по плаванию.",
      fullDescription:
        "Заплыв «Буревестник» — ежегодные соревнования по плаванию.",
      eventType: "sport",
      category: "Плавание",
      status: "published",
      startDate: new Date("2026-07-10T10:00:00.000Z"),
      endDate: new Date("2026-07-10T14:00:00.000Z"),
      registrationDeadline: new Date("2026-07-05T23:59:59.000Z"),
      participantPoints: 80,
      fanPoints: 15,
      maxParticipants: 60,
      location: "Университетский бассейн",
      address: "ул. Академическая, 12",
      contactEmail: "swim@university.ru",
      contactPhone: "+7 (999) 456-78-90",
      duration: "5 часов",
      level: "Любительский",
      format: "Заплыв на время",
      rules: "Старт по свистку, финиш по касанию.",
      equipment: "Шапочка, очки для плавания",
      requirements: "Медицинская справка для бассейна",
    },
  ];
  for (const e of events) {
    await prisma.event.create({ data: e });
  }
  console.log(`  ✓ ${events.length} событий`);

  // ─── Регистрация (user на event #3) ───
  await prisma.eventRegistration.create({
    data: { userId: user.id, eventId: 3, registrationType: "participant" },
  });

  // ─── Уровни ───
  const LEVELS_SEED = [
    {
      name: "Львёнок",
      minPoints: 0,
      bonusPercent: 2,
      color: "#5aa05a",
      description: "Стартовый значок в профиле",
      prize: "Стартовый значок в профиле",
    },
    {
      name: "Медный лев",
      minPoints: 500,
      bonusPercent: 7,
      color: "#b87333",
      description: "Приоритетная запись на мероприятия",
      prize: "Приоритетная запись на мероприятия",
    },
    {
      name: "Бронзовый лев",
      minPoints: 1200,
      bonusPercent: 10,
      color: "#cd7f32",
      description: "Доступ к закрытым мероприятиям клуба",
      prize: "Доступ к закрытым мероприятиям клуба",
    },
    {
      name: "Серебряный лев",
      minPoints: 2500,
      bonusPercent: 15,
      color: "#9ea7b3",
      description: "Фирменный мерч спортклуба",
      prize: "Фирменный мерч спортклуба",
    },
    {
      name: "Золотой лев",
      minPoints: 3500,
      bonusPercent: 17,
      color: "#d4a017",
      description: "Скидка 10% в магазине мерча",
      prize: "Скидка 10% в магазине мерча",
    },
    {
      name: "Сибирский лев",
      minPoints: 5000,
      bonusPercent: 20,
      color: "#003466",
      description: "Скидка 10% в ФОЦ ТПУ",
      prize: "Скидка 10% в ФОЦ ТПУ",
    },
  ];

  await prisma.level.createMany({ data: LEVELS_SEED });
  console.log(`  ✓ уровней: ${LEVELS_SEED.length}`);

  // ─── Магазин ───
  // ─── Магазин ───
  const shopItems = await Promise.all([
    prisma.shopItem.create({
      data: {
        name: "Худи «Сибирские львы»",
        description: "Тёплая толстовка",
        image: "/uploads/shop/hoodie.webp",
        price: 2500,
        points: 100,
      },
    }),
    prisma.shopItem.create({
      data: {
        name: "Футболка «Политехник»",
        description: "Хлопок, чёрная",
        image: "/uploads/shop/shirt.webp",
        price: 1200,
        points: 50,
      },
    }),
    prisma.shopItem.create({
      data: {
        name: "Кепка с логотипом",
        description: "Размер регулируется",
        image: "/uploads/shop/cap.webp",
        price: 800,
        points: 30,
      },
    }),
    prisma.shopItem.create({
      data: {
        name: "Кружка",
        description: "Фирменная кружка",
        image: "/uploads/shop/mug.webp",
        price: 600,
        points: 20,
      },
    }),
    prisma.shopItem.create({
      data: {
        name: "Бутылка спортивная",
        description: "0.75л, металл",
        image: "/uploads/shop/bottle.webp",
        price: 500,
        points: 15,
      },
    }),
  ]);
  console.log(`  ✓ ${shopItems.length} товаров`);

  // ─── Заказы со снапшотом ───
  // Заказ: Футболка (1 шт) + Кружка (2 шт)
  const orderItems = [
    { product: shopItems[1], quantity: 1 },
    { product: shopItems[3], quantity: 2 },
  ].map(({ product, quantity }) => ({
    productId: product.id,
    name: product.name,
    image: product.image ?? "/img/placeholder.webp", // ← fallback, если у товара нет картинки
    points: product.points,
    quantity,
    linePoints: product.points * quantity,
  }));

  const totalPoints = orderItems.reduce(
    (sum, item) => sum + item.linePoints,
    0,
  ); // 50 + 40 = 90

  await prisma.order.create({
    data: {
      userId: user.id,
      totalPoints,
      status: "completed",
      items: { create: orderItems },
    },
  });

  // Списать баллы за заказ (280 - 90 = 190)
  await prisma.user.update({
    where: { id: user.id },
    data: { totalPoints: { decrement: totalPoints } },
  });
  console.log(
    `  ✓ заказ с ${orderItems.length} позициями, списано ${totalPoints} баллов`,
  );

  // ─── История баллов ───
  await prisma.pointsHistory.createMany({
    data: [
      {
        userId: user.id,
        points: 120,
        reason: "Регистрация на «Ночная лига волейбола»",
      },
      { userId: user.id, points: 50, reason: "Бонус за первое участие" },
      {
        userId: user.id,
        points: -50,
        reason: "Покупка: Футболка «Политехник»",
      },
      { userId: user.id, points: 100, reason: "Приз за 2 место в турнире" },
      { userId: user.id, points: 40, reason: "Бонус активного участника" },
    ],
  });

  // ─── Уведомления ───
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: "Регистрация подтверждена",
        message: "Вы зарегистрированы на «Ночная лига волейбола»",
        type: "success",
      },
      {
        userId: user.id,
        title: "Баллы начислены",
        message: "Начислено 50 баллов за участие",
        type: "info",
      },
      {
        userId: user.id,
        title: "Заказ завершён",
        message: "Ваш заказ #1 отправлен",
        type: "info",
        isRead: true,
      },
    ],
  });

  console.log("✅ Seeding complete");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
