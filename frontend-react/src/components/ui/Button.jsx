import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled,
    fullWidth = false,
    type = 'button',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 shadow-sm",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500",
        accent: "bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-600 shadow-md shadow-accent-100",
        outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-500",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus-visible:ring-slate-500",
        link: "text-accent-600 underline-offset-4 hover:underline focus-visible:ring-accent-600",
        danger: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-md shadow-red-100",
    };

    const sizes = {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 py-2 text-sm",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
