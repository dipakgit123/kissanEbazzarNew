import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';
import { API_BASE_API } from '../config/api';
import { localizeApiMessage } from '../utils/localizeApiMessage';

const VeterinarianForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t('vetForgotPassword.emailRequired', { defaultValue: 'Email is required' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_API}/veterinarians/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          localizeApiMessage(
            i18n,
            t,
            data.message,
            'vetForgotPassword.success',
            'If the email exists, a reset link has been sent.'
          )
        );
      } else {
        toast.error(t('vetForgotPassword.failed', { defaultValue: 'Could not process your request' }));
      }
    } catch (error) {
      console.error('Veterinarian forgot password error:', error);
      toast.error(t('vetForgotPassword.networkError', { defaultValue: 'Network error. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Toaster position="top-right" />
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-800">
          {t('vetForgotPassword.title', { defaultValue: 'Forgot your password?' })}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          {t('vetForgotPassword.subtitle', { defaultValue: 'Enter your veterinarian account email and we will send you a reset link.' })}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('vetLogin.emailAddress')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder={t('vetLogin.emailPlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-xl px-4 py-3.5 font-bold text-white transition-all ${
              isSubmitting
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40'
            }`}
          >
            {isSubmitting
              ? t('vetForgotPassword.sending', { defaultValue: 'Sending reset link...' })
              : t('vetForgotPassword.submit', { defaultValue: 'Send reset link' })}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/veterinarian/login" className="text-sm font-medium text-blue-600 hover:underline">
            {t('vetForgotPassword.backToLogin', { defaultValue: 'Back to veterinarian login' })}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VeterinarianForgotPassword;
