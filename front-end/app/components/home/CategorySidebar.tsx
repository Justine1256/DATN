const categories = [
    "Woman's Fashion",
    "Men's Fashion",
    "Electronics",
    "Home & Lifestyle",
    "Medicine",
    "Sport & Outdoor",
    "Baby's & Toys",
    "Groceries & Pets",
    "Health & Beauty",
  ];
  
  export default function CategorySidebar() {
    return (
      <div className="w-1/4 border-r pr-4">
        <ul className="space-y-4 text-lg font-medium">
          {categories.map((cat, i) => (
            <li key={i} className="cursor-pointer hover:text-blue-600 transition">
              {cat}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  