export default function Header() {
    return (
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-4 py-2 w-1/3"
        />
        <div className="flex items-center space-x-4">
          <span className="w-8 h-8 rounded-full bg-gray-300"></span>
        </div>
      </header>
    );
  }
  