import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeDisplay.css';

/**
 * QRCodeDisplay Component
 * 
 * Generates and displays a QR code for session access.
 * The QR code encodes a full join URL that can be scanned by any phone camera.
 * 
 * @param {Object} props
 * @param {string} props.accessCode - Session access code (e.g., "ABCD-1234")
 * @param {number} props.size - QR code size in pixels (default: 150)
 */
export function QRCodeDisplay({ accessCode, size = 150 }) {
  // Don't render anything if no access code is provided
  if (!accessCode) {
    return (
      <div className="session-qr-placeholder">
        <div className="qr-placeholder-box">
          <span className="qr-placeholder-text">QR Code</span>
          <span className="qr-placeholder-subtitle">Waiting for session...</span>
        </div>
      </div>
    );
  }

  // Generate the full join URL
  const joinUrl = `${window.location.origin}/join?code=${accessCode}`;

  return (
    <div className="session-qr-code">
      <QRCodeSVG
        value={joinUrl}
        size={size}
        level="M" // Error correction level: L, M, Q, H (M = 15% recovery)
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
