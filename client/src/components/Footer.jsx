export default function Footer({ brand, tagline, source }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="brand">
            <span className="brand-mark">◆</span>
            <span className="brand-text">
              <strong>{brand}</strong>
              <small>{tagline}</small>
            </span>
          </div>
          <p className="footer-note">
            The workspace where agencies, studios and freelancers run every client project.
          </p>
        </div>

        <div>
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#cta">Pricing</a>
        </div>

        <div>
          <h4>Company</h4>
          <a href="#top">About</a>
          <a href="#top">Careers</a>
          <a href="#top">Contact</a>
        </div>

        <div>
          <h4>Resources</h4>
          <a href="#top">Docs</a>
          <a href="#top">API</a>
          <a href="#top">Support</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} {brand}. All rights reserved.</span>
        {source && <span className="data-source">Content source: {source}</span>}
      </div>
    </footer>
  );
}
