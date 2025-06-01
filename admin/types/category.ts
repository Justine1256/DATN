export type Category = {
  id: number;
  name: string;
  image: string[]; // nếu API trả chuỗi, bạn có thể xử lý split ở nơi fetch
  priceRange?: string;
  createdBy?: string;
  stock?: number;
  parent_id?: number | null;
  parent?: Category | null; // parent category có thể null hoặc object
};
