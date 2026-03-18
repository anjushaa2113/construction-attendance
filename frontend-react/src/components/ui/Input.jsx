import React, { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    error,
    startIcon,
    endIcon,
    className = '',
    fullWidth = true,
    ...props
}, ref) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {startIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        {startIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
            flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200
            ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:ring-blue-600'}
            ${startIcon ? 'pl-10' : ''}
            ${endIcon ? 'pr-10' : ''}
            ${className}
          `}
                    {...props}
                />
                {endIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                        {endIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500 font-medium animate-in slide-in-from-top-1 fade-in duration-200">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
