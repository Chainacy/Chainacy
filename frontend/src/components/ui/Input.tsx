interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Input = ({ label, className, ...props }: InputProps) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-xs sm:text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <input
      className={`w-full px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-400 
        rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 
        focus:outline-none ${className || ''} 
        disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60`}
      {...props}
    />
  </div>
);

export const Textarea = ({ label, className, ...props }: TextareaProps) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-xs sm:text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <textarea
      className={`w-full px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-400 
        rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 
        focus:outline-none resize-vertical ${className || ''} 
        disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60`}
      {...props}
    />
  </div>
);
