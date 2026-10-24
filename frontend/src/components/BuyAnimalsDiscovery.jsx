import { useTranslation } from 'react-i18next';
import './BuyAnimalsDiscovery.css';

export const AnimalSearchInput = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="buy-animal-search">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
      <input type="search" aria-label={t('buyPage.searchPlaceholder')} placeholder={t('buyPage.searchPlaceholder')} value={value} onChange={(event) => onChange(event.target.value)} />
      {value && <button type="button" onClick={() => onChange('')} aria-label={t('home.clearSearch')}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M6 18 18 6" /></svg></button>}
    </div>
  );
};

const BuyAnimalsDiscovery = ({ sectionRef, locationLabel, searchQuery, onSearchChange, distanceMode, onDistanceChange, categories, selectedCategory, onCategoryChange, onClearCategory }) => {
  const { t } = useTranslation();
  return (
    <section ref={sectionRef} className="buy-discovery" aria-labelledby="buy-discovery-title">
      <div className="buy-discovery-heading">
        <div><h1 id="buy-discovery-title">{t('buyPage.browseByCategory')}</h1><p>{t('buyPage.browseCategorySubtitle')}</p></div>
        <div className="buy-discovery-location">
          <span className="buy-discovery-location-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
          <p>{locationLabel}</p>
        </div>
      </div>
      <div className="buy-discovery-controls">
        <AnimalSearchInput value={searchQuery} onChange={onSearchChange} />
        <button type="button" className="buy-nearby-switch" role="switch" aria-checked={distanceMode === 'nearby'} onClick={() => onDistanceChange(distanceMode === 'nearby' ? 'all' : 'nearby')}>
          {t('buyPage.nearby')}
          <span className="buy-nearby-track" aria-hidden="true"><span /></span>
        </button>
      </div>
      <div className="buy-category-grid" role="group" aria-label={t('buyPage.browseByCategory')}>
        {categories.map((category) => (
          <button key={category.key} type="button" className="buy-category-choice" aria-pressed={selectedCategory === category.key} onClick={() => onCategoryChange(category.key)}>
            <span className="buy-category-image">
              {category.image ? <img src={category.image} alt="" width="56" height="56" /> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>}
            </span>
            <span className="buy-category-label">{category.label}</span>
            {selectedCategory === category.key && <span className="buy-category-check" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      {selectedCategory && <button type="button" className="buy-category-clear" onClick={onClearCategory}>{t('home.clearFilter')} <span aria-hidden="true">×</span></button>}
    </section>
  );
};

export default BuyAnimalsDiscovery;
