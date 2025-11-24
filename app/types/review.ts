export interface ReviewUser {
  _id: string;
  name: string;
  img: string;
}

export interface Review {
  _id: string;
  user: ReviewUser;
  restaurant: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}
