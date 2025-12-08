import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./socket/SocketContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SocketProvider>
      <App />
    </SocketProvider>
  </BrowserRouter>
);

