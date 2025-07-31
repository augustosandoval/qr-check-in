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
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
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
        // Add these additional options
        preferredCamera: 'environment', // Use back camera on mobile
        returnDetailedScanResult: true,
      }
    );

    setScanner(qrScanner);

    return () => {
      qrScanner.destroy();
    };
  }, [onScan, toast]);

  // Check camera permissions on component mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Check if we have camera permissions
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          setCameraPermission(permission.state);
        };
      } catch (error) {
        console.warn('Could not check camera permissions:', error);
      }
    };

    checkCameraPermission();
  }, []);

  const startScanning = async () => {
    if (!scanner || !videoRef.current) return;

    try {
      // First check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setHasCamera(false);
        toast({
          title: "No Camera Found",
          description: "No camera detected on this device.",
          variant: "destructive",
        });
        return;
      }

      await scanner.start();
      setIsScanning(true);
      setHasCamera(true);
      
      // Force video element to be visible and properly sized
      if (videoRef.current) {
        videoRef.current.style.display = 'block';
        videoRef.current.play(); // Ensure video is playing
      }

      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error) {
      console.error('Error starting scanner:', error);
      setHasCamera(false);
      setIsScanning(false);
      
      let errorMessage = "Unable to access camera.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access.";
          setCameraPermission('denied');
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is already in use by another application.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (!scanner) return;

    scanner.stop();
    setIsScanning(false);
    
    // Hide video element
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
    
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
              autoPlay
              muted
              playsInline
              style={{ 
                display: isScanning ? 'block' : 'none',
                backgroundColor: '#000' // Add black background for video
              }}
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  {!hasCamera ? (
                    <>
                      <CameraOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Camera not available</p>
                    </>
                  ) : cameraPermission === 'denied' ? (
                    <>
                      <CameraOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Camera permission denied</p>
                      <p className="text-xs mt-1">Please enable camera access in your browser settings</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Click to start scanning</p>
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
            disabled={!hasCamera || cameraPermission === 'denied'}
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
          
          {cameraPermission === 'denied' && (
            <p className="text-xs text-center text-muted-foreground">
              To use the camera, please refresh the page and allow camera access when prompted.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};