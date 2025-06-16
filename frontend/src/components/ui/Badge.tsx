import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "tertiary";
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  let variantClasses = "";

  switch (variant) {
    case "primary":
      variantClasses = "bg-blue-500 text-white";
      break;
    case "secondary":
      variantClasses = "bg-gray-200 text-gray-800";
      break;
    case "tertiary":
      variantClasses = "bg-transparent text-gray-600";
      break;
    default:
      variantClasses = "bg-blue-500 text-white";
  }

  return (
    <span
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
