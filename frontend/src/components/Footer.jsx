import Link from './ExperienceLink';
import React from 'react';

import { useTranslation } from 'react-i18next';
import './Footer.css';
import logo from '../assets/images/animal_logog.jpeg';
import {
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import {
  SUPPORT_FACEBOOK_URL,
  SUPPORT_INSTAGRAM_URL,
  SUPPORT_TELEGRAM_URL,
  SUPPORT_YOUTUBE_URL,
  getWhatsAppSupportUrl,
} from '../config/support';

const Footer = () => {
  const { t } = useTranslation();
  const whatsappUrl = getWhatsAppSupportUrl();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Facebook',
      href: SUPPORT_FACEBOOK_URL,
      icon: FaFacebookF,
    },
    {
      name: 'Instagram',
      href: SUPPORT_INSTAGRAM_URL,
      icon: FaInstagram,
    },
    {
      name: 'WhatsApp',
      href: whatsappUrl,
      icon: FaWhatsapp,
    },
    {
      name: 'YouTube',
      href: SUPPORT_YOUTUBE_URL,
      icon: FaYoutube,
    },
    {
      name: 'Telegram',
      href: SUPPORT_TELEGRAM_URL,
      icon: FaTelegramPlane,
    },
  ].filter(({ href }) => Boolean(href));

  return (
    <footer className="site-footer py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" aria-label="Animal E Bazar" className="mb-4 flex items-center space-x-3 transition-opacity hover:opacity-90">
              <div className="footer-brand-icon w-10 h-10 shrink-0 rounded-xl flex items-center justify-center">
                <img src={logo} alt="" width="40" height="40" className="footer-brand-logo" />
              </div>
              <div className="min-w-0">
                <h3 className="footer-brand-name text-xl font-bold">Animal E Bazar</h3>
                <p className="text-sm footer-muted">{t('footer.farmersMarketplace')}</p>
              </div>
            </Link>
            <p className="footer-muted text-sm">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm footer-muted">
              <li><Link to="/" className="footer-link">{t('header.home')}</Link></li>
              <li><Link to="/sell-animal" className="footer-link">{t('header.sellAnimal')}</Link></li>
              <li><Link to="/profile" className="footer-link">{t('header.profile')}</Link></li>
              <li><Link to="/about" className="footer-link">{t('footer.aboutUs')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm footer-muted">
              <li><Link to="/help" className="footer-link">{t('footer.helpCenter')}</Link></li>
              <li><Link to="/contact" className="footer-link">{t('footer.contactUs')}</Link></li>
              <li><Link to="/privacy" className="footer-link">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/terms" className="footer-link">{t('footer.termsOfService')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.connectWithUs')}</h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ name, href, icon: SocialIcon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    title={name}
                    className="footer-social flex h-11 w-11 items-center justify-center rounded-full border text-lg transition-colors duration-200"
                  >
                    {React.createElement(SocialIcon)}
                  </a>
              ))}
              {socialLinks.length === 0 && <Link to="/contact" className="footer-link text-sm underline underline-offset-4">{t('footer.contactUs')}</Link>}
            </div>
          </div>
        </div>
        <div className="footer-bottom mt-8 pt-8 text-center text-sm">
          <p>{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
