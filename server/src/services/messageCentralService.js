const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

class MessageCentralService {
  constructor() {
    this.cachedAuthToken = null;
    this.cachedAuthTokenExpiry = null;
  }

  getCustomerId() {
    const customerId = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;

    if (!customerId) {
      throw new Error('Message Central customer ID is not configured');
    }

    return customerId;
  }

  getPasswordKey() {
    const key = process.env.MESSAGE_CENTRAL_PASSWORD_KEY;

    if (!key) {
      throw new Error('Message Central password key is not configured');
    }

    return key;
  }

  getBaseUrl() {
    return (process.env.MESSAGE_CENTRAL_BASE_URL || 'https://cpaas.messagecentral.com').replace(/\/+$/, '');
  }

  getFlowType() {
    return (process.env.MESSAGE_CENTRAL_FLOW_TYPE || 'SMS').toUpperCase();
  }

  getSmsSenderId() {
    const senderId = process.env.MESSAGE_CENTRAL_SMS_SENDER_ID;

    if (!senderId) {
      throw new Error('Message Central SMS sender ID is not configured');
    }

    return senderId;
  }

  getSmsMessageType() {
    return (process.env.MESSAGE_CENTRAL_SMS_MESSAGE_TYPE || 'TRANSACTION').toUpperCase();
  }

  getSmsType() {
    return (process.env.MESSAGE_CENTRAL_SMS_TYPE || 'SMS').toUpperCase();
  }

  getSmsTemplate() {
    const template = process.env.MESSAGE_CENTRAL_SMS_TEMPLATE;

    if (!template) {
      throw new Error('Message Central SMS template is not configured');
    }

    return template;
  }

  getSmsTemplateRegistration() {
    const templateId = process.env.MESSAGE_CENTRAL_SMS_TEMPLATE_ID;
    const entityId = process.env.MESSAGE_CENTRAL_SMS_ENTITY_ID;

    if ((templateId && !entityId) || (!templateId && entityId)) {
      throw new Error('Message Central SMS template ID and entity ID must both be provided together');
    }

    return { templateId, entityId };
  }

  getCountryCode() {
    return String(process.env.MESSAGE_CENTRAL_COUNTRY_CODE || '91');
  }

  getEmail() {
    return process.env.MESSAGE_CENTRAL_EMAIL || '';
  }

  getTimeout() {
    return Number(process.env.MESSAGE_CENTRAL_TIMEOUT_MS || 15000);
  }

  getMobileNumber(phoneNumber) {
    return String(phoneNumber || '').replace(/^\+/, '').replace(/^91/, '');
  }

  buildCustomOtpMessage(otp) {
    return this.getSmsTemplate()
      .replace(/\{#OTP#\}/g, String(otp))
      .replace(/\{\{OTP\}\}/g, String(otp));
  }

  decodeJwtExpiry(token) {
    try {
      const parts = String(token || '').split('.');
      if (parts.length < 2) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (!payload.exp) {
        return null;
      }

      return new Date(payload.exp * 1000);
    } catch (error) {
      logger.error('Unable to decode Message Central auth token expiry:', error.message);
      return null;
    }
  }

  hasValidCachedAuthToken() {
    return Boolean(
      this.cachedAuthToken &&
      this.cachedAuthTokenExpiry &&
      this.cachedAuthTokenExpiry.getTime() - Date.now() > 60 * 1000
    );
  }

  async getAuthToken(forceRefresh = false) {
    if (!forceRefresh && this.hasValidCachedAuthToken()) {
      return this.cachedAuthToken;
    }

    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/auth/v1/authentication/token`,
        {
          params: {
            customerId: this.getCustomerId(),
            key: this.getPasswordKey(),
            scope: 'NEW',
            country: this.getCountryCode(),
            email: this.getEmail() || undefined,
          },
          headers: {
            accept: '*/*',
          },
          timeout: this.getTimeout(),
        }
      );

      const authToken = response.data?.data?.authToken || response.data?.authToken || response.data?.token;
      if (!authToken) {
        throw new Error(this.extractErrorMessage({ response }));
      }

      this.cachedAuthToken = authToken;
      this.cachedAuthTokenExpiry = this.decodeJwtExpiry(authToken);

      return authToken;
    } catch (error) {
      logger.error('Message Central auth token error:', error.response?.data || error.message);
      throw new Error(`Failed to generate Message Central auth token: ${this.extractErrorMessage(error)}`);
    }
  }

  async getHeaders(forceRefresh = false) {
    return {
      authToken: await this.getAuthToken(forceRefresh),
    };
  }

  extractErrorMessage(error) {
    const data = error.response?.data || {};
    const responseCode = data?.data?.responseCode || data?.responseCode;
    const referenceId = data?.data?.referenceId || data?.data?.transactionId;

    if (typeof data?.token === 'string' && data.token.trim()) {
      return 'Token generation succeeded but response format was unexpected';
    }

    if (typeof data?.errorMessage === 'string' && data.errorMessage.trim()) {
      return data.errorMessage;
    }

    if (typeof data?.data?.errorMessage === 'string' && data.data.errorMessage.trim()) {
      return data.data.errorMessage;
    }

    if (typeof data?.message === 'number') {
      return String(data.message);
    }

    if (typeof data?.status === 'number' && data.status !== 200) {
      return `Message Central status ${data.status}`;
    }

    if (typeof data?.data?.verificationStatus === 'string' && data.data.verificationStatus.trim() && data.data.verificationStatus !== 'VERIFICATION_COMPLETED') {
      return data.data.verificationStatus;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join(', ');
    }

    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }

    if (responseCode) {
      return `Message Central responseCode ${responseCode}${referenceId ? ` (referenceId: ${referenceId})` : ''}`;
    }

    return error.message || 'Unknown Message Central error';
  }

  async sendOTP(phoneNumber) {
    const mobileNumber = this.getMobileNumber(phoneNumber);

    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/verification/v3/send`,
        null,
        {
          params: {
            countryCode: this.getCountryCode(),
            flowType: this.getFlowType(),
            mobileNumber,
          },
          headers: await this.getHeaders(),
          timeout: this.getTimeout(),
        }
      );

      const data = response.data || {};
      const verificationId = data.data?.verificationId || data.data?.verificationId?.toString?.();

      if (Number(data.responseCode) !== 200 || !verificationId) {
        throw new Error(this.extractErrorMessage({ response }));
      }

      logger.log(`Message Central OTP sent to ${phoneNumber}: ${verificationId}`);

      return {
        success: true,
        verificationId: String(verificationId),
        messageSid: String(verificationId),
        status: data.data?.responseCode || data.responseCode || '200',
        channel: this.getFlowType().toLowerCase(),
        provider: 'messagecentral',
        timeout: data.data?.timeout || null,
      };
    } catch (error) {
      logger.error(`Message Central send OTP error for ${phoneNumber}:`, error.response?.data || error.message);
      throw new Error(`Failed to send OTP via Message Central: ${this.extractErrorMessage(error)}`);
    }
  }

  async sendCustomOTP(phoneNumber, otp) {
    const mobileNumber = this.getMobileNumber(phoneNumber);
    const { templateId, entityId } = this.getSmsTemplateRegistration();

    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/verification/v3/send`,
        null,
        {
          params: {
            countryCode: this.getCountryCode(),
            flowType: 'SMS',
            mobileNumber,
            senderId: this.getSmsSenderId(),
            type: this.getSmsType(),
            messageType: this.getSmsMessageType(),
            message: this.buildCustomOtpMessage(otp),
            ...(templateId && entityId ? { templateId, entityId } : {}),
          },
          headers: await this.getHeaders(),
          timeout: this.getTimeout(),
        }
      );

      const data = response.data || {};
      const messageSid = data.data?.transactionId || data.data?.verificationId || null;

      if (Number(data.responseCode) !== 200) {
        throw new Error(this.extractErrorMessage({ response }));
      }

      logger.log(`Message Central custom SMS OTP sent to ${phoneNumber}${messageSid ? `: ${messageSid}` : ''}`);

      return {
        success: true,
        messageSid: messageSid ? String(messageSid) : null,
        status: data.data?.responseCode || data.responseCode || '200',
        channel: 'sms',
        provider: 'messagecentral-sms',
        timeout: data.data?.timeout || null,
      };
    } catch (error) {
      logger.error(`Message Central custom SMS OTP error for ${phoneNumber}:`, error.response?.data || error.message);
      throw new Error(`Failed to send custom SMS via Message Central: ${this.extractErrorMessage(error)}`);
    }
  }

  async verifyOTP(verificationId, otp) {
    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/verification/v3/validateOtp`,
        {
          params: {
            verificationId,
            code: String(otp),
          },
          headers: await this.getHeaders(),
          timeout: this.getTimeout(),
        }
      );

      const data = response.data || {};
      const verificationStatus = data.data?.verificationStatus || 'VERIFICATION_FAILED';
      const valid = Number(data.responseCode) === 200 && verificationStatus === 'VERIFICATION_COMPLETED';

      return {
        sid: String(verificationId),
        status: verificationStatus,
        valid,
        errorMessage: valid ? null : this.extractErrorMessage({ response }),
      };
    } catch (error) {
      logger.error(`Message Central verify OTP error for verification ${verificationId}:`, error.response?.data || error.message);

      const errorMessage = this.extractErrorMessage(error);
      if (/invalid|expired|failed|incorrect|otp|wrong/i.test(errorMessage)) {
        return {
          sid: String(verificationId),
          status: 'VERIFICATION_FAILED',
          valid: false,
          errorMessage,
        };
      }

      throw new Error(`Failed to verify OTP via Message Central: ${errorMessage}`);
    }
  }
}

module.exports = new MessageCentralService();
