import type {
  FieldValues,
  UseFormRegister,
  RegisterOptions,
  FieldError,
  Path,
  UseFormStateReturn,
} from "react-hook-form";

interface SelectOption {
  id: string | number | boolean;
  value: string;
}

interface AppFormInputProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<T>;
  rules?: RegisterOptions<T, Path<T>>;
  error?: FieldError;
  className?: string;
  formState?: UseFormStateReturn<T>;
  options?: SelectOption[];
}

const AppFormInput = <T extends FieldValues>({
  label,
  name,
  type = "text",
  placeholder,
  register,
  rules,
  error,
  className = "",
  formState,
  options = [],
}: AppFormInputProps<T>) => {
  const showError = !!error && formState?.isSubmitted;

  const inputClass = `w-full border rounded p-2 focus:outline-none focus:ring-2 ${
    showError
      ? "border-red-500 focus:ring-red-400"
      : "border-gray-300 focus:ring-blue-400"
  }`;

  return (
    <div className={`mb-3 ${className} w-full`}>
      <label className="block mb-1 text-white font-medium">
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </label>

      {/* TEXTAREA */}
      {type === "textarea" && (
        <textarea
          {...register(name, rules)}
          placeholder={placeholder}
          rows={4}
          className={inputClass}
        />
      )}

      {/* SELECT */}
      {type === "select" && (
        <select {...register(name, rules)} className={`${inputClass} bg-gray-800 text-white`}>
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
              {option.value}
            </option>
          ))}
        </select>
      )}

      {/* CHECKBOX */}
      {type === "checkbox" && (
        <input
          type="checkbox"
          {...register(name, rules)}
          className="h-4 w-4 cursor-pointer"
        />
      )}

      {/* RADIO */}
      {type === "radio" && (
        <div className="flex gap-4 pt-1">
          {options.map((option) => (
            <label
              key={String(option.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                value={String(option.id)}
                {...register(name, rules)}
              />
              {option.value}
            </label>
          ))}
        </div>
      )}

      {/* DEFAULT INPUT TYPES */}
      {!["textarea", "select", "checkbox", "radio"].includes(type) && (
        <input
          type={type}
          {...register(name, rules)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}

      {showError && (
        <p className="text-red-500 text-sm mt-1">{error?.message}</p>
      )}
    </div>
  );
};

export default AppFormInput;
