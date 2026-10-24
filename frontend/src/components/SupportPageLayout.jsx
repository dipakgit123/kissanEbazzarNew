import './SupportPages.css';

export default function SupportPageLayout({ title, description, icon, metadata, children }) {
  return <div className="support-page">
    <header className="support-header">
      <div className="support-header-row">
        <span className="support-page-icon" aria-hidden="true">{icon}</span>
        <div className="support-header-copy"><h1>{title}</h1><p>{description}</p>{metadata && <p className="support-metadata">{metadata}</p>}</div>
      </div>
    </header>
    {children}
  </div>;
}
