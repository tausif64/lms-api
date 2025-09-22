import prisma from "../../config/db.js";

export const findAllCourses = async () => {
  return await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true, // for linking
      thumbnailUrl: true, // preview image
      averageRating: true,
      reviewCount: true,
      sortDescription: true, // short description or subtitle
      level: true,
      estimatedHours: true,
      isPaid: true,
      prices: {
        select: {
          amount: true,
          currency: true,
          discountPrice: true, // if applicable
        },
      },
      owner: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};



export const searchCoursesService = async (queryParams) => {
  const {
    query = "",
    categoryId,
    level,
    isPaid,
    countryCode,
    page = 1,
    limit = 10,
  } = queryParams;

  // Build Prisma filters
  const filters = {
    AND: [],
  };

  // Search text in title, sortDescription, or instructor name
  if (query) {
    filters.AND.push({
      OR: [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          sortDescription: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          owner: {
            user: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  if (categoryId) {
    filters.AND.push({ categoryId });
  }

  if (level) {
    filters.AND.push({ level });
  }

  if (typeof isPaid === "boolean") {
    filters.AND.push({ isPaid });
  }

  // Pagination logic
  const skip = (page - 1) * limit;

  // Fetch data
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        averageRating: true,
        reviewCount: true,
        sortDescription: true,
        level: true,
        estimatedHours: true,
        isPaid: true,
        prices: {
          where: {
            OR: [
              { isDefault: true },
              ...(countryCode ? [{ countryCode }] : []),
            ],
          },
          orderBy: {
            isDefault: "desc", // Prioritize default prices
          },
          take: 1,
          select: {
            amount: true,
            currency: true,
            currencySymbol: true,
            discountedAmount: true,
            countryCode: true,
          },
        },
        owner: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),

    prisma.course.count({
      where: filters,
    }),
  ]);

  return {
    data: courses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
