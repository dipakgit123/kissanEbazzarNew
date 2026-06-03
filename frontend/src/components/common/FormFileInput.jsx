import React from 'react';
import { useTranslation } from 'react-i18next';

const FormFileInput = ({
  id,
  file,
  name,
  label,
  accept,
  onChange,
  helperText,
  required = false,
  placeholderImage,
  placeholderAlt,
  placeholderVariant
}) => {
  const [fileName, setFileName] = React.useState('');
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!file) {
      setFileName('');
    }
  }, [file]);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
      // Check if onChange expects a file or an event
      if (onChange.length === 1) {
        onChange(selectedFile);
      } else {
        onChange(e);
      }
    }
  };

  return (
    <div className="form-group mb-6">
      <label className="form-label block mb-2 font-semibold text-gray-700">
        {label} {required && <span className="required text-red-500">*</span>}
      </label>
      <div className="file-input-wrapper">
        <input
          type="file"
          id={id || name}
          name={name}
          accept={accept}
          onChange={handleChange}
          required={required}
          className="hidden"
        />
        <label 
          htmlFor={id || name}
          className={`file-input-label flex w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all duration-200 ${
            placeholderImage || placeholderVariant === 'video'
              ? 'min-h-[170px] flex-col justify-center px-4 py-5 text-center'
              : 'items-center justify-center px-4 py-3'
          }`}
        >
          {fileName ? (
            <>
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium truncate max-w-xs">{fileName}</span>
            </>
          ) : (
            <>
              {placeholderImage && (
                <img
                  src={placeholderImage}
                  alt={placeholderAlt || label}
                  className="mb-3 h-20 w-auto object-contain"
                />
              )}
              {placeholderVariant === 'video' && (
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-600 bg-white shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.68L9.54 5.98A1 1 0 008 6.82z" />
                    </svg>
                  </div>
                </div>
              )}
              <div className={`flex items-center justify-center ${(placeholderImage || placeholderVariant === 'video') ? 'gap-2' : ''}`}>
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-gray-600">{t('formLabels.chooseFile')}</span>
              </div>
            </>
          )}
        </label>
      </div>
      {helperText && <p className="text-sm text-gray-500 mt-2">{helperText}</p>}
    </div>
  );
};

export default FormFileInput;
