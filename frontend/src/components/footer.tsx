export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} FoodLoop — Food Saved, Smiles Shared
        </p>
        <div className="flex justify-center items-center space-x-4 mt-2">
          <a href="#" className="text-sm hover:underline">
            Privacy
          </a>
          <span className="text-sm">•</span>
          <a href="#" className="text-sm hover:underline">
            Terms
          </a>
          <span className="text-sm">•</span>
          <a href="#" className="text-sm hover:underline">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
