type FormErrorProps = {
  message?: string | null;
  className?: string;
  variant?: "default" | "compact" | "compact-page";
};

export default function FormError({ message, className = "", variant = "default" }: FormErrorProps) {
  if (!message) return null;

  const style = variant === "default"
    ? "rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
    : `${variant === "compact-page" ? "rounded-md" : "rounded"} border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700`;

  return (
    <div role="alert" className={`${style} ${className}`}>
      {message}
    </div>
  );
}
