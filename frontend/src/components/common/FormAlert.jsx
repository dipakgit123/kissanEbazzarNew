import React from 'react';

const FormAlert = ({ type, message }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
};

export default FormAlert;
