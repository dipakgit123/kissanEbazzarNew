import React from 'react';
import AppLoader, { FullPageLoader, InlineLoader } from './AppLoader';

const CowLoader = ({ message, size = 'medium' }) => (
  <AppLoader message={message} size={size} />
);

export const FullPageCowLoader = ({ message }) => (
  <FullPageLoader message={message} />
);

export const InlineCowLoader = ({ message }) => (
  <InlineLoader message={message} size="small" />
);

export default CowLoader;
