export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>© {new Date().getFullYear()} FoodLoop — Food Saved, Smiles Shared</p>
        <div className="footer__links">
          <a href="#">Privacy</a>
          <span>•</span>
          <a href="#">Terms</a>
          <span>•</span>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
