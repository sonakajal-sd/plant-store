export type Review = {
  id: number;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  isMine: boolean;
};

// Everything the product page needs about reviews
export type ReviewSummary = {
  average: number | null; // null = no reviews yet
  count: number;
  reviews: Review[];
  canReview: boolean; // true = this customer received the plant
  myReview: { rating: number; comment: string } | null;
};
