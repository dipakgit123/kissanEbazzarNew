export const SUPPORT_WHATSAPP_NUMBER = import.meta.env.VITE_SUPPORT_WHATSAPP || '';
export const SUPPORT_WHATSAPP_MESSAGE = import.meta.env.VITE_SUPPORT_WHATSAPP_MESSAGE || 'Hi! I need help with Animal E Bazar.';
export const SUPPORT_FACEBOOK_URL = import.meta.env.VITE_FACEBOOK_URL || '';
export const SUPPORT_INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM_URL || '';
export const SUPPORT_YOUTUBE_URL = import.meta.env.VITE_YOUTUBE_URL || '';
export const SUPPORT_TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL || '';

export const getWhatsAppSupportUrl = () => {
  const normalizedNumber = SUPPORT_WHATSAPP_NUMBER.replace(/\D/g, '');

  if (!normalizedNumber) {
    return '';
  }

  const params = new URLSearchParams({
    text: SUPPORT_WHATSAPP_MESSAGE,
  });

  return `https://wa.me/${normalizedNumber}?${params.toString()}`;
};
