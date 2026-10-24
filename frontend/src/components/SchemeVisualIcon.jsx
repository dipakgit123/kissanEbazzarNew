import { createElement } from 'react';
import { FiGrid, FiCreditCard, FiGift, FiShield, FiBookOpen, FiHeart, FiHome, FiCheckCircle, FiFileText, FiClipboard } from 'react-icons/fi';

const icons = {
  all: FiGrid, loan: FiCreditCard, subsidy: FiGift, insurance: FiShield,
  training: FiBookOpen, health: FiHeart, general: FiHome,
  benefits: FiGift, eligibility: FiCheckCircle, required_documents: FiFileText, application_steps: FiClipboard
};

export default function SchemeVisualIcon({ kind, ...props }) {
  return createElement(icons[kind] || FiHome, { 'aria-hidden': true, ...props });
}
