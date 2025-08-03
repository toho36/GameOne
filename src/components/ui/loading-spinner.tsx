import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "primary" | "secondary";
}

export function LoadingSpinner({
    className,
    size = "md",
    variant = "default"
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8"
    };

    const variantClasses = {
        default: "border-gray-300 border-t-gray-600",
        primary: "border-blue-200 border-t-blue-600",
        secondary: "border-gray-200 border-t-gray-600"
    };

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-2 border-solid",
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

export function LoadingDots({
    className,
    size = "md"
}: {
    className?: string;
    size?: "sm" | "md" | "lg";
}) {
    const sizeClasses = {
        sm: "w-1 h-1",
        md: "w-2 h-2",
        lg: "w-3 h-3"
    };

    return (
        <div className={cn("flex space-x-1", className)} role="status" aria-label="Loading">
            <div
                className={cn(
                    "animate-bounce rounded-full bg-current",
                    sizeClasses[size]
                )}
                style={{ animationDelay: "0ms" }}
            />
            <div
                className={cn(
                    "animate-bounce rounded-full bg-current",
                    sizeClasses[size]
                )}
                style={{ animationDelay: "150ms" }}
            />
            <div
                className={cn(
                    "animate-bounce rounded-full bg-current",
                    sizeClasses[size]
                )}
                style={{ animationDelay: "300ms" }}
            />
            <span className="sr-only">Loading...</span>
        </div>
    );
} 