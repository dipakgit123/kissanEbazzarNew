import React from 'react';

const SubmitButton = ({ loading, loadingText, submitText }) => {
  return (
    <button type="submit" className="submit-button" disabled={loading}>
      {loading ? loadingText : submitText}
    </button>
  );
};

export default SubmitButton;
