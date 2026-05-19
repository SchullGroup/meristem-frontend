export interface ApiResponse<T> {
  isSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  statusCode: string;
  time: string;
  data: T;
}

export interface PaginatedResponse<T> {
  isSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  statusCode: string;
  time: string;
  data: {
    totalElements: number;
    totalPages: number;
    pageable: Pageable;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    size: number;
    content: Array<T>;
    number: number;
    sort: {
      unsorted: boolean;
      sorted: boolean;
      empty: boolean;
    };
    empty: boolean;
  };
}

export interface Pageable {
  unpaged: boolean;
  pageNumber: number;
  paged: boolean;
  pageSize: number;
  offset: number;
  sort: {
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
}

export interface ContentPaginatedResponse<T> {
  content: T[];
  last: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type EntitlementResponse = ApiResponse<{
  entitlements: {
    totalPages: number;
    totalElements: number;
    pageable: Pageable;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    size: number;
    content: Array<{
      shareholderId: string;
      accountNumber: string;
      name: string;
      chn: string;
      brokerCode: string;
      address: string;
      bankName: string;
      bankAccount: string;
      unitsHeld: number;
      rightsRatio: string;
      rightsDue: number;
      amountPayable: number;
    }>;
    number: number;
    sort: {
      unsorted: boolean;
      sorted: boolean;
      empty: boolean;
    };
    empty: boolean;
  };
  totalShareholders: number;
  totalUnitsHeld: number;
  totalRightsDue: number;
  totalAmountDue: number;
  computedAt: string;
  id: string | null;
}>;
