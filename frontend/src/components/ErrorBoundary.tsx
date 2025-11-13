/**
 * ErrorBoundary Component
 *
 * React error boundary for graceful error handling throughout the application.
 * Catches JavaScript errors in child components and displays a fallback UI.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error details for debugging
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // You could also log the error to an error reporting service here
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="h-full w-full flex items-center justify-center bg-background">
                    <div className="max-w-md p-6 border border-destructive/50 rounded-lg bg-destructive/5">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            <h2 className="text-lg font-semibold text-destructive">
                                Something went wrong
                            </h2>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            An unexpected error occurred in the application. This has been
                            logged for investigation.
                        </p>

                        {this.state.error && (
                            <details className="mb-4">
                                <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                                    Error Details
                                </summary>
                                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-40">
                                    <p className="font-semibold mb-1">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="text-xs whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={this.handleReset} variant="default">
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
