import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  const socialLinks = [
    {
      name: 'Facebook',
      href: SUPPORT_FACEBOOK_URL,
      icon: FaFacebookF,
      hoverClass: 'hover:bg-[#1877F2] hover:border-[#1877F2]',
    },
    {
      name: 'Instagram',
      href: SUPPORT_INSTAGRAM_URL,
      icon: FaInstagram,
      hoverClass: 'hover:bg-[#E1306C] hover:border-[#E1306C]',
    },
    {
      name: 'WhatsApp',
      href: whatsappUrl,
      icon: FaWhatsapp,
      hoverClass: 'hover:bg-[#25D366] hover:border-[#25D366]',
    },
    {
      name: 'YouTube',
      href: SUPPORT_YOUTUBE_URL,
      icon: FaYoutube,
      hoverClass: 'hover:bg-[#FF0000] hover:border-[#FF0000]',
    },
    {
      name: 'Telegram',
      href: SUPPORT_TELEGRAM_URL,
      icon: FaTelegramPlane,
      hoverClass: 'hover:bg-[#229ED9] hover:border-[#229ED9]',
    },
  ];

  return (
    <footer className="bg-[#000600] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="mb-4 flex items-center space-x-3 transition-opacity hover:opacity-90">
              <div className="w-10 h-10 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('footer.appName')}</h3>
                <p className="text-sm text-gray-400">{t('footer.farmersMarketplace')}</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm">
              {t('footer.description')}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-[#15BB73] transition-colors">{t('header.home')}</Link></li>
              <li><Link to="/sell-animal" className="hover:text-[#15BB73] transition-colors">{t('header.sellAnimal')}</Link></li>
              <li><Link to="/profile" className="hover:text-[#15BB73] transition-colors">{t('header.profile')}</Link></li>
              <li><Link to="/about" className="hover:text-[#15BB73] transition-colors">{t('footer.aboutUs')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/help" className="hover:text-[#15BB73] transition-colors">{t('footer.helpCenter')}</Link></li>
              <li><Link to="/contact" className="hover:text-[#15BB73] transition-colors">{t('footer.contactUs')}</Link></li>
              <li><Link to="/privacy" className="hover:text-[#15BB73] transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/terms" className="hover:text-[#15BB73] transition-colors">{t('footer.termsOfService')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.connectWithUs')}</h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ name, href, icon: SocialIcon, hoverClass }) => {
                const isActive = Boolean(href);

                return (
                  <a
                    key={name}
                    href={isActive ? href : undefined}
                    target={isActive ? '_blank' : undefined}
                    rel={isActive ? 'noreferrer' : undefined}
                    aria-label={name}
                    title={isActive ? name : `${name} link not configured`}
                    onClick={(event) => {
                      if (!isActive) {
                        event.preventDefault();
                      }
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-gray-600 text-lg text-white transition-all duration-200 ${
                      isActive
                        ? `bg-[#111827] hover:-translate-y-1 ${hoverClass}`
                        : 'cursor-not-allowed bg-gray-800/50 text-gray-500 opacity-60'
                    }`}
                  >
                    {React.createElement(SocialIcon)}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
