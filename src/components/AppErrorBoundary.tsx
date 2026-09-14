import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onReload?: () => void;
};

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Deliberately avoid rendering or persisting technical error details. React
    // still reports them to the local development console during development.
  }

  private handleReload = () => {
    if (this.props.onReload) {
      this.setState({ hasError: false });
      this.props.onReload();
      return;
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error-screen" role="alert">
          <div className="fatal-error-card">
            <h1>应用遇到问题</h1>
            <p>界面未能正常显示。你的原始图片不会被修改。</p>
            <p lang="en">The interface could not be displayed. Your original images were not modified.</p>
            <button type="button" onClick={this.handleReload}>
              重新加载 / Reload
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
