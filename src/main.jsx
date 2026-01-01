import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { SocketProvider } from "./socket/SocketContext.jsx";
import DevErrorBoundary from "./devtools/DevErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DevErrorBoundary>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </DevErrorBoundary>
  </React.StrictMode>
);
