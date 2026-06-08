import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';
import { API_BASE_API } from '../config/api';
import { localizeApiMessage } from '../utils/localizeApiMessage';

const VeterinarianResetPassword = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error(t('vetResetPassword.missingToken', { defaultValue: 'Reset token is missing or invalid.' }));
      return;
    }

    if (password.length < 8) {
      toast.error(t('vetResetPassword.passwordMinLength', { defaultValue: 'Password must be at least 8 characters long.' }));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('vetResetPassword.passwordMismatch', { defaultValue: 'Passwords do not match.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_API}/veterinarians/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          localizeApiMessage(
            i18n,
            t,
            data.message,
            'vetResetPassword.success',
            'Password reset successfully.'
          )
        );
        setTimeout(() => navigate('/veterinarian/login', { replace: true }), 1200);
      } else {
        toast.error(t('vetResetPassword.failed', { defaultValue: 'Failed to reset password.' }));
      }
    } catch (error) {
      console.error('Veterinarian reset password error:', error);
      toast.error(t('vetResetPassword.networkError', { defaultValue: 'Network error. Please try again.' }));
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
          {t('vetResetPassword.title', { defaultValue: 'Set a new password' })}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          {t('vetResetPassword.subtitle', { defaultValue: 'Choose a strong password for your veterinarian dashboard.' })}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('vetResetPassword.newPassword', { defaultValue: 'New password' })}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder={t('vetResetPassword.newPasswordPlaceholder', { defaultValue: 'Enter new password' })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              {t('vetResetPassword.confirmPassword', { defaultValue: 'Confirm password' })}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder={t('vetResetPassword.confirmPasswordPlaceholder', { defaultValue: 'Re-enter new password' })}
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
              ? t('vetResetPassword.submitting', { defaultValue: 'Updating password...' })
              : t('vetResetPassword.submit', { defaultValue: 'Reset password' })}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/veterinarian/login" className="text-sm font-medium text-blue-600 hover:underline">
            {t('vetResetPassword.backToLogin', { defaultValue: 'Back to veterinarian login' })}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VeterinarianResetPassword;
