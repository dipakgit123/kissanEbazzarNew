import React from 'react';
import AppLoader, { FullPageLoader, InlineLoader } from './AppLoader';

const CowLoader = ({ message = 'Loading...', size = 'medium' }) => (
  <AppLoader message={message} size={size} />
);

export const FullPageCowLoader = ({ message = 'Loading...' }) => (
  <FullPageLoader message={message} />
);

export const InlineCowLoader = ({ message = 'Loading...' }) => (
  <InlineLoader message={message} size="small" />
);

export default CowLoader;
