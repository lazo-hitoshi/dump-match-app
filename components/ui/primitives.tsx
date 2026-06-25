import type { CSSProperties, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
  onClick,
}: ButtonProps) {
  const styles: Record<string, CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #f59e0b, #ea580c)",
      color: "#111827",
      border: "none",
    },
    secondary: {
      background: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #374151",
    },
    ghost: {
      background: "transparent",
      color: "#d1d5db",
      border: "1px solid #374151",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...styles[variant],
        borderRadius: 12,
        padding: "10px 16px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 20,
      }}
    >
      {title ? <h2 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h2> : null}
      {children}
    </section>
  );
}
