export type Category = {
  id: number;
  name: string;
  image: string[]; // Luôn là mảng, có thể rỗng
  priceRange?: string;
  createdBy?: string;
  stock?: number;
};
