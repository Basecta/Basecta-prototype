interface FormInputProps {
  label: string;
  id: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  light?: boolean;
  autoComplete?: string;
  error?: boolean;
}

export function FormInput({
  label,
  id,
  name,
  type,
  value,
  onChange,
  required,
  placeholder,
  helpText,
  light,
  autoComplete,
  error,
}: FormInputProps) {
  const borderClass = error
    ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
    : `border-gray-300 focus:ring-indigo-500${light ? '' : ' dark:border-gray-600'}`;

  const darkClass = light ? '' : ' dark:bg-gray-800 dark:text-gray-100';

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete ?? (type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off')}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white text-gray-900 ${borderClass}${darkClass}`}
      />
      {helpText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>}
    </div>
  );
}
