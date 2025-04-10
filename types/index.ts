export type SearchResultType = {
  id: number | string;
  url: string;
  title: string;
  description: string;
  image?: string;
  totalPages?: number;
  relevantPages?: {
    relavantStr: string;
    relavantPages: number[];
  };
};

export enum Grade {
  ALL = "all",
  KINDERGARTEN = "K",
  GRADE_1 = "1",
  GRADE_2 = "2",
  GRADE_3 = "3",
  GRADE_4 = "4",
  GRADE_5 = "5",
  GRADE_6 = "6",
  GRADE_7 = "7",
  GRADE_8 = "8",
  GRADE_9 = "9",
  GRADE_10 = "10",
  GRADE_11 = "11",
  GRADE_12 = "12",
}

export type ISearchHistory = {
  search_keyword: string;
  grade: Grade;
};
