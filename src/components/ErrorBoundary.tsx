import { Component } from 'react';
import type { ReactNode } from 'react';
import { BlinkingCaret } from './primitives/BlinkingCaret';

interface State {
  error: Error | null;
  stackOpen: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, stackOpen: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, stackOpen: false };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[runtime error]', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    return (
      <main role="alert" className="min-h-screen p-8 font-mono text-sm">
        <div className="max-w-2xl">
          <div className="text-2xl text-semantic-error flex items-center gap-2 mb-4">
            runtime error<BlinkingCaret color="var(--semantic-error)" />
          </div>
          <div className="pl-6 flex flex-col gap-1 text-fg-secondary">
            <div>
              <span className="text-fg-tertiary">error.type: </span>
              frontend_error
            </div>
            <div>
              <span className="text-fg-tertiary">error.code: </span>
              {e.name}
            </div>
            <div>
              <span className="text-fg-tertiary">message: </span>
              {e.message}
            </div>
          </div>
          <div className="pl-6 mt-6 flex flex-col gap-2 text-fg-secondary">
            <button
              type="button"
              className="text-left hover:text-fg-primary"
              onClick={() => window.location.reload()}
            >
              &gt; [r] reload page
            </button>
            <button
              type="button"
              className="text-left hover:text-fg-primary"
              onClick={() =>
                navigator.clipboard.writeText(`${e.name}: ${e.message}`)
              }
            >
              &gt; [c] copy error
            </button>
            <button
              type="button"
              className="text-left hover:text-fg-primary"
              onClick={() =>
                this.setState({ stackOpen: !this.state.stackOpen })
              }
            >
              &gt; [s] toggle stack trace
            </button>
          </div>
          {this.state.stackOpen && (
            <pre className="mt-4 p-3 bg-bg-raised border border-border-base text-xs text-fg-tertiary overflow-auto max-h-[400px]">
              {e.stack}
            </pre>
          )}
        </div>
      </main>
    );
  }
}
