import { Component } from "react";

export default class DevErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <div
        style={{
          padding: "1rem",
          background: "#fee",
          color: "#600",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h2>Render crashed</h2>
        <p>{error?.message ?? String(error)}</p>
        {info?.componentStack && (
          <pre style={{ whiteSpace: "pre-wrap" }}>{info.componentStack}</pre>
        )}
      </div>
    );
  }
}
