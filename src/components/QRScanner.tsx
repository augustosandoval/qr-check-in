import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, Scan, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (data: string) => void;
}

export const QRScanner = ({ onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const addDebugInfo = (info: string) => {
    console.log('QR Scanner Debug:', info);
    setDebugInfo(prev => [...prev.slice(-4), info]);
  };

  // Manual QR scanning function
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Use QrScanner to scan the canvas
      const result = await QrScanner.scanImage(canvas);
      addDebugInfo(`QR Code found: ${result}`);
      onScan(result);
      toast({
        title: "QR Code Scanned",
        description: "Processing student information...",
      });
    } catch (error) {
      // No QR code found, which is normal
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) {
      addDebugInfo('Video ref not available');
      return;
    }

    try {
      addDebugInfo('Requesting camera access...');
      
      // Get camera stream directly
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      addDebugInfo(`Got media stream with ${mediaStream.getVideoTracks().length} video tracks`);
      
      const video = videoRef.current;
      video.srcObject = mediaStream;
      setStream(mediaStream);

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const onLoadedMetadata = () => {
          addDebugInfo(`Video loaded: ${video.videoWidth}x${video.videoHeight}`);
          setVideoLoaded(true);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          resolve();
        };

        const onError = (e: Event) => {
          const target = e.target as HTMLVideoElement;
          addDebugInfo(`Video error: ${target.error?.message || 'Unknown error'}`);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          reject(new Error('Video failed to load'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
      });

      // Start playing video
      await video.play();
      addDebugInfo('Video is now playing');

      setIsScanning(true);
      setHasCamera(true);

      // Start QR scanning interval
      scanIntervalRef.current = setInterval(scanQRCode, 300); // Scan every 300ms

      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });

    } catch (error) {
      console.error('Error starting scanner:', error);
      addDebugInfo(`Start error: ${error}`);
      
      setHasCamera(false);
      setIsScanning(false);
      
      let errorMessage = "Unable to access camera.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
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
    addDebugInfo('Stopping scanner...');
    
    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop media stream
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(`Stopped track: ${track.kind}`);
      });
      setStream(null);
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setVideoLoaded(false);
    
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

  // Test basic camera access
  const testCameraAccess = async () => {
    try {
      addDebugInfo('Testing basic camera access...');
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      addDebugInfo('Basic camera access successful');
      
      // Test video display
      if (videoRef.current && !isScanning) {
        videoRef.current.srcObject = testStream;
        await videoRef.current.play();
        addDebugInfo('Test video is playing');
        
        // Stop test after 3 seconds
        setTimeout(() => {
          testStream.getTracks().forEach(track => track.stop());
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          addDebugInfo('Test stream stopped');
        }, 3000);
      } else {
        testStream.getTracks().forEach(track => track.stop());
      }
      
      toast({
        title: "Camera Test Passed",
        description: "Camera is working - test video should show for 3 seconds",
      });
    } catch (error) {
      addDebugInfo(`Camera test failed: ${error}`);
      toast({
        title: "Camera Test Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="p-6 shadow-elegant">
        <div className="space-y-4">
          <div className="text-center">
            <Scan className="h-12 w-12 mx-auto text-primary mb-2" />
            <h2 className="text-2xl font-bold">Student Check-in</h2>
            <p className="text-muted-foreground">Scan QR code for attendance</p>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full"
              autoPlay
              muted
              playsInline
              webkit-playsinline="true"
              style={{ 
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isScanning ? 'scaleX(-1)' : 'none'
              }}
            />
            
            {/* Hidden canvas for QR scanning */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  {!hasCamera ? (
                    <>
                      <CameraOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Camera not available</p>
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
            
            {isScanning && !videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Loading camera...</p>
                </div>
              </div>
            )}
            
            {isScanning && videoLoaded && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-sm">
                Scanning...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={toggleScanning}
              variant={isScanning ? "outline" : "default"}
              size="lg"
              className="w-full"
              disabled={!hasCamera}
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-5 w-5 mr-2" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
            
            <Button 
              onClick={testCameraAccess}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test Camera Access
            </Button>
          </div>
          
          {/* Debug information */}
          {debugInfo.length > 0 && (
            <div className="text-xs bg-muted p-2 rounded max-h-24 overflow-y-auto">
              <div className="font-semibold mb-1">Debug Info:</div>
              {debugInfo.map((info, index) => (
                <div key={index} className="text-muted-foreground">
                  {info}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};