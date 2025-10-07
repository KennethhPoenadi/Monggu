import React, { useState, useRef, useEffect } from 'react';

// Type definitions for html5-qrcode
declare global {
  interface Html5QrcodeScanner {
    render(
      onSuccess: (decodedText: string) => void,
      onError: (errorMessage: string) => void
    ): void;
    clear(): void;
  }
  
  interface Html5QrcodeScannerConfig {
    fps: number;
    qrbox: { width: number; height: number };
    aspectRatio: number;
  }
  
  const Html5QrcodeScanner: {
    new (
      elementId: string,
      config: Html5QrcodeScannerConfig,
      verbose: boolean
    ): Html5QrcodeScanner;
  };
}

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onScanSuccess, 
  onScanFailure 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const loadScanner = async () => {
      if (isScanning) {
        // Dynamically import the library
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            console.log("QR Code detected:", decodedText);
            onScanSuccess(decodedText);
            setIsScanning(false);
            scanner.clear();
          },
          (errorMessage: string) => {
            console.log("QR Code scan error:", errorMessage);
            if (onScanFailure) {
              onScanFailure(errorMessage);
            }
          }
        );

        scannerRef.current = scanner;
      }
    };

    loadScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning, onScanSuccess, onScanFailure]);

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-controls mb-4">
        {!isScanning ? (
          <button 
            onClick={startScanning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start QR Scanner
          </button>
        ) : (
          <button 
            onClick={stopScanning}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Stop Scanner
          </button>
        )}
      </div>
      
      {isScanning && (
        <div className="scanner-container">
          <div id="qr-reader" style={{ width: '100%' }}></div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;