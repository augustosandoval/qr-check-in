import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (data: string) => void;
}

export const QRScanner = ({ onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        console.log('QR Code detected:', result);
        onScan(result.data);
        toast({
          title: "QR Code Scanned",
          description: "Processing student information...",
        });
      },
      {
        onDecodeError: (err) => {
          // Only log decode errors in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Decode error:', err);
          }
        },
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      }
    );

    setScanner(qrScanner);

    return () => {
      qrScanner.destroy();
    };
  }, [onScan, toast]);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      await scanner.start();
      setIsScanning(true);
      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error) {
      console.error('Error starting scanner:', error);
      setHasCamera(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (!scanner) return;

    scanner.stop();
    setIsScanning(false);
    toast({
      title: "Camera Stopped",
      description: "QR scanner deactivated",
    });
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="p-6 shadow-elegant">
        <div className="space-y-4">
          <div className="text-center">
            <Scan className="h-12 w-12 mx-auto text-primary mb-2" />
            <h2 className="text-2xl font-bold">Student Check-in</h2>
            <p className="text-muted-foreground">Scan QR code for attendance</p>
          </div>

          <div className="relative bg-muted rounded-lg overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  {hasCamera ? (
                    <>
                      <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Click to start scanning</p>
                    </>
                  ) : (
                    <>
                      <CameraOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Camera not available</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={toggleScanning}
            variant={isScanning ? "outline" : "scanner"}
            size="xl"
            className="w-full"
            disabled={!hasCamera}
          >
            {isScanning ? (
              <>
                <CameraOff className="h-5 w-5" />
                Stop Scanning
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Start Scanning
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};