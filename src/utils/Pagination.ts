export type PageRequest = {
  page: number;
  pageSize: number;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export class Pagination {
  static normalize(request?: Partial<PageRequest>): PageRequest {
    const page = Math.max(1, Number(request?.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(request?.pageSize ?? 10)));
    return { page, pageSize };
  }

  static buildResult<T>(
    items: T[],
    page: number,
    pageSize: number,
    totalItems: number
  ): PageResult<T> {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    return { items, page: safePage, pageSize, totalItems, totalPages };
  }

  static offset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }
}

