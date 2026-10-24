import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import vetLoginImage from '../assets/images/login2.png';
import LanguageSwitcher from './LanguageSwitcher';
import { API_BASE_API } from '../config/api';
import { localizeApiMessage } from '../utils/localizeApiMessage';
import './VeterinarianLogin.css';

export default function VeterinarianLogin() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const errorRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (errors.general) errorRef.current?.focus();
  }, [errors.general]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: '', general: '' }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (requestRef.current) return;
    const email = formData.email.trim();
    const nextErrors = {};
    if (!email) nextErrors.email = t('vetLogin.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = t('vetLogin.emailInvalid');
    if (!formData.password) nextErrors.password = t('vetLogin.passwordRequired');
    else if (formData.password.length < 6) nextErrors.password = t('vetLogin.passwordMinLength');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    // A stalled request must not leave the form permanently disabled.
    const timeout = setTimeout(() => controller.abort('timeout'), 20000);
    try {
      const response = await fetch(`${API_BASE_API}/veterinarians/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: formData.password }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => null);
      if (controller.signal.aborted) {
        if (controller.signal.reason === 'timeout') setErrors({ general: t('vetLogin.networkError') });
        return;
      }
      if (response.ok && data?.success && data.token && data.veterinarian) {
        localStorage.setItem('vetToken', data.token);
        localStorage.setItem('veterinarian', JSON.stringify(data.veterinarian));
        navigate('/veterinarian/dashboard', { replace: true });
        return;
      }
      const accountErrors = {
        'Your account is pending verification': 'vetLogin.accountPending',
        'Your account has been rejected': 'vetLogin.accountRejected',
        'Your account has been suspended': 'vetLogin.accountSuspended'
      };
      setErrors({ general: accountErrors[data?.message]
        ? t(accountErrors[data.message])
        : localizeApiMessage(i18n, t, data?.message, 'vetLogin.loginFailed', 'Login failed') });
    } catch {
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') {
        setErrors({ general: t('vetLogin.networkError') });
      }
    } finally {
      clearTimeout(timeout);
      requestRef.current = null;
      if (!controller.signal.aborted || controller.signal.reason === 'timeout') setIsLoading(false);
    }
  };

  return (
    <main className="vet-login-page site-background">
      <div className="vet-login-toolbar"><LanguageSwitcher /></div>
      <section className="vet-login-card" aria-labelledby="vet-login-heading">
        <div className="vet-login-art" aria-hidden="true">
          <img src={vetLoginImage} alt="" />
        </div>
        <div className="vet-login-content">
          <header className="vet-login-heading">
            <h1 id="vet-login-heading">{t('vetLogin.title')}</h1>
            <p>{t('vetLogin.subtitle')}</p>
          </header>
          <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
            {errors.general && <div className="vet-login-error" role="alert" tabIndex={-1} ref={errorRef}>{errors.general}</div>}
            <div className="vet-login-field">
              <label htmlFor="vet-email">{t('vetLogin.emailAddress')}</label>
              <div className="vet-login-input">
                <FiMail aria-hidden="true" />
                <input ref={emailRef} id="vet-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required
                  value={formData.email} onChange={handleChange} disabled={isLoading} placeholder={t('vetLogin.emailPlaceholder')}
                  aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'vet-email-error' : undefined} />
              </div>
              {errors.email && <p id="vet-email-error" className="vet-login-field-error" role="alert">{errors.email}</p>}
            </div>
            <div className="vet-login-field">
              <div className="vet-login-password-label">
                <label htmlFor="vet-password">{t('vetLogin.password')}</label>
                <Link to="/veterinarian/forgot-password">{t('vetLogin.forgotPassword')}</Link>
              </div>
              <div className="vet-login-input">
                <FiLock aria-hidden="true" />
                <input ref={passwordRef} id="vet-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                  value={formData.password} onChange={handleChange} disabled={isLoading} placeholder={t('vetLogin.passwordPlaceholder')}
                  aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'vet-password-error' : undefined} />
                <button type="button" className="vet-login-visibility" onClick={() => setShowPassword(value => !value)}
                  aria-label={t(showPassword ? 'vetLogin.hidePassword' : 'vetLogin.showPassword')} aria-pressed={showPassword} aria-controls="vet-password">
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="vet-password-error" className="vet-login-field-error" role="alert">{errors.password}</p>}
            </div>
            <button type="submit" className="vet-login-submit" disabled={isLoading}>
              <span aria-live="polite">{t(isLoading ? 'vetLogin.loggingIn' : 'vetLogin.signIn')}</span>
            </button>
          </form>
          <div className="vet-login-registration">
            <p>{t('vetLogin.newToPlatform')}</p>
            <Link to="/veterinarian/register">{t('vetLogin.registerAsVet')}</Link>
          </div>
          <p className="vet-login-note">{t('vetLogin.noteMessage')}</p>
          <Link to="/login" className="vet-login-back"><FiArrowLeft aria-hidden="true" />{t('vetLogin.backToUserLogin')}</Link>
        </div>
      </section>
    </main>
  );
}
