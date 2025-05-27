// data/products.ts
export const products = [
    {
      id: 1,
      name: "Black T-shirt",
      size: "S, M, L, XL",
      price: "$80.00",
      stock: 486,
      sold: 155,
      category: "Fashion",
      rating: 4.5,
      reviews: 55,
      image: "/images/tshirt.png",
    },
    {
      id: 2,
      name: "Green Leather Bag",
      size: "S, M",
      price: "$136.00",
      stock: 784,
      sold: 674,
      category: "Hand Bag",
      rating: 4.1,
      reviews: 143,
      image: "/images/bag.png",
    },
    {
      id: 3,
      name: "Golden Dress",
      size: "S, M",
      price: "$219.00",
      stock: 769,
      sold: 180,
      category: "Fashion",
      rating: 4.4,
      reviews: 174,
      image: "/images/dress.png",
    },
    {
      id: 4,
      name: "Gray Cap",
      size: "S, M, L",
      price: "$76.00",
      stock: 571,
      sold: 87,
      category: "Cap",
      rating: 4.2,
      reviews: 23,
      image: "/images/cap.png",
    },
  ];
  export interface Product {
    id: number;
    name: string;
    size: string;
    price: string;
    stock: number;
    sold: number;
    category: string;
    rating: number;
    reviews: number;
    image: string;
  }
  