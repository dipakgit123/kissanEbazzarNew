import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiSearch, FiMapPin, FiPhone, FiMessageCircle, FiTrash2, FiImage, FiUser, FiRefreshCw, FiX, FiCheckCircle } from 'react-icons/fi';
import { useWishlist } from '../contexts/useWishlist';
import { wishlistCopy, wishlistPrice, wishlistPhone } from '../utils/wishlistCopy';
import toast from 'react-hot-toast';
import './WishlistPage.css';

const WishlistPage = () => {
  const { t, i18n } = useTranslation();
  const { wishlist, loading, error, reload, removeFromWishlist } = useWishlist();
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const copy = wishlistCopy[language] || wishlistCopy.en;
  const locale = `${['en', 'hi', 'mr'].includes(language) ? language : 'en'}-IN`;
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('recent');
  const [pending, setPending] = useState([]);
  const removing = useRef(new Set());
  const label = animalType => t(`animalTypes.${animalType}`, { defaultValue: animalType });
  const number = value => Number(value).toLocaleString(locale);
  const date = value => {
    const parsed = new Date(value);
    return !value || Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const clearFilters = () => { setSearch(''); setType('all'); };
  const visible = wishlist.filter(animal => (type === 'all' || animal.animalType === type) && [animal.title, animal.breed, animal.location, label(animal.animalType)].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => {
    if (sort === 'recent') return (Date.parse(b.addedAt) || 0) - (Date.parse(a.addedAt) || 0);
    const left = wishlistPrice(a.price), right = wishlistPrice(b.price);
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    return sort === 'low' ? left - right : right - left;
  });
  const remove = async animal => {
    if (removing.current.has(animal.id)) return;
    removing.current.add(animal.id); setPending([...removing.current]);
    try {
      const result = await removeFromWishlist(animal.id);
      if (result?.success === false) throw new Error('Removal failed');
      toast.success(t('wishlist.removedFromWishlist'));
    } catch { toast.error(copy.removeError); }
    finally { removing.current.delete(animal.id); setPending([...removing.current]); }
  };

  return <main className="wl-page"><div className="wl-container">
    <header className="wl-header">
      <span className="wl-header-icon"><FiHeart aria-hidden="true" /></span>
      <div className="wl-header-copy"><h1>{t('wishlist.title')}</h1><p>{t('wishlist.subtitle')}</p></div>
      <div className="wl-saved-count"><strong>{loading || error ? '—' : number(wishlist.length)}</strong><span>{t('wishlist.savedAnimals')}</span></div>
      {wishlist.length > 0 && <Link className="wl-browse wl-browse-secondary" to="/buy-animals">{t('home.browseAnimals')}<FiArrowRight aria-hidden="true" /></Link>}
    </header>

    {error ? <section className="wl-state" role="alert"><FiRefreshCw aria-hidden="true" /><h2>{copy.error}</h2><button type="button" className="wl-browse" onClick={reload}>{copy.retry}</button></section>
      : loading && !wishlist.length ? <div className="wl-state" role="status">{copy.loading}</div>
      : !wishlist.length ? <section className="wl-empty" aria-labelledby="wl-empty-heading">
        <div className="wl-empty-copy"><span className="wl-empty-icon"><FiHeart aria-hidden="true" /></span><h2 id="wl-empty-heading">{t('wishlist.empty')}</h2><p>{t('wishlist.emptySubtitle')}</p><Link to="/buy-animals" className="wl-browse"><FiSearch aria-hidden="true" />{t('home.browseAnimals')}<FiArrowRight aria-hidden="true" /></Link></div>
        <div className="wl-guide"><h3>{copy.how}</h3><ol>
          <li><span><FiSearch aria-hidden="true" /></span><div><strong>{copy.discover}</strong><p>{copy.discoverHint}</p></div></li>
          <li><span><FiHeart aria-hidden="true" /></span><div><strong>{copy.save}</strong><p>{copy.saveHint}</p></div></li>
          <li><span><FiCheckCircle aria-hidden="true" /></span><div><strong>{copy.revisit}</strong><p>{copy.revisitHint}</p></div></li>
        </ol></div>
      </section> : <>
        <section className="wl-toolbar" aria-label={copy.search}>
          <label className="wl-search" htmlFor="wishlist-search"><span className="sr-only">{copy.search}</span><FiSearch aria-hidden="true" /><input id="wishlist-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={copy.search} /></label>
          <label className="wl-select" htmlFor="wishlist-type"><span>{copy.type}</span><select id="wishlist-type" value={type} onChange={event => setType(event.target.value)}><option value="all">{copy.all}</option>{[...new Set([...wishlist.map(animal => animal.animalType), ...(type === 'all' ? [] : [type])])].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
          <label className="wl-select" htmlFor="wishlist-sort"><span>{copy.sort}</span><select id="wishlist-sort" value={sort} onChange={event => setSort(event.target.value)}>{['recent', 'low', 'high'].map(value => <option key={value} value={value}>{copy[value]}</option>)}</select></label>
          {(search || type !== 'all') && <div className="wl-filter-summary"><p role="status">{copy.showing.replace('{{shown}}', number(visible.length)).replace('{{total}}', number(wishlist.length))}</p><button type="button" onClick={clearFilters}><FiX aria-hidden="true" />{copy.clear}</button></div>}
        </section>
        {!visible.length ? <div className="wl-state"><FiSearch aria-hidden="true" /><h2>{copy.noMatch}</h2><button type="button" className="wl-browse wl-browse-secondary" onClick={clearFilters}>{copy.clear}</button></div> : <div className="wl-grid">{visible.map(animal => {
          const detailsUrl = `/animal/${encodeURIComponent(animal.animalType)}/${encodeURIComponent(animal.originalId)}`;
          const title = animal.title === animal.animalType ? label(animal.animalType) : animal.title;
          const price = wishlistPrice(animal.price);
          const phone = wishlistPhone(animal.phoneNumber);
          const sold = animal.status === 'sold';
          const savedDate = date(animal.addedAt);
          const milk = ['cow', 'buffalo', 'goat'].includes(animal.animalType) && Number(animal.milkProduction) > 0 ? `${number(animal.milkProduction)} ${copy.milk}` : '';
          return <article className="wl-card" key={animal.id} data-animal-id={animal.id}>
            <button type="button" className="wl-remove" aria-label={`${t('wishlist.removeFromWishlist')}: ${title}`} title={t('wishlist.removeFromWishlist')} disabled={pending.includes(animal.id)} aria-busy={pending.includes(animal.id)} onClick={() => remove(animal)}><FiTrash2 aria-hidden="true" /></button>
            <Link className="wl-card-main" to={detailsUrl}>
              <div className="wl-photo"><FiImage aria-hidden="true" />{animal.imageSrc && <img src={animal.imageSrc} alt={title} loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}</div>
              <div className="wl-card-copy"><div className="wl-type"><span>{label(animal.animalType)}</span>{sold && <span className="wl-sold">{copy.sold}</span>}</div><h2>{title}</h2>{animal.breed && animal.breed !== title && <p className="wl-breed">{animal.breed}</p>}<p className="wl-price">{price === null ? copy.price : new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)}</p><p className="wl-location"><FiMapPin aria-hidden="true" /><span>{animal.location || copy.location}</span></p></div>
            </Link>
            <div className="wl-card-meta">{animal.sellerName && <span><FiUser aria-hidden="true" /><span>{animal.sellerName}</span></span>}{milk && <span>{milk}</span>}{savedDate && <span className="wl-saved-date">{t('wishlist.addedOn')} {savedDate}</span>}</div>
            <div className="wl-card-actions"><Link to={detailsUrl} className="wl-view">{t('wishlist.viewDetails')}<FiArrowRight aria-hidden="true" /></Link>
              {phone && !sold ? <><a className="wl-call" href={`tel:+${phone}`}><FiPhone aria-hidden="true" />{t('animalDetail.callNow')}</a><a className="wl-whatsapp" href={`https://wa.me/${phone}?text=${encodeURIComponent(copy.whatsapp.replace('{{animal}}', title))}`} target="_blank" rel="noopener noreferrer"><FiMessageCircle aria-hidden="true" />WhatsApp</a></> : !sold && <span className="wl-no-contact">{copy.unavailable}</span>}
            </div>
          </article>;
        })}</div>}
      </>}
  </div></main>;
};

export default WishlistPage;
