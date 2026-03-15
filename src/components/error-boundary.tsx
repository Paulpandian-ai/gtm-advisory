"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0f172a] border border-[#ef4444]/30 rounded-lg p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-[#ef4444] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#f8fafc] mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-[#64748b] max-w-md mx-auto mb-4">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              "An unexpected error occurred"}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
            className="border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
