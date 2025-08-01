import { useState } from 'react';
import { QRScanner } from '@/components/QRScanner';
import { StudentInfo } from '@/components/StudentInfo';

const Index = () => {
  const [currentView, setCurrentView] = useState<'scanner' | 'student'>('scanner');
  const [qrData, setQrData] = useState<string>('');

  const handleQRScan = (data: string) => {
    setQrData(data);
    setCurrentView('student');
  };

  const handleBackToScanner = () => {
    setCurrentView('scanner');
    setQrData('');
  };

  return (
    <div className="min-h-screen bg-gradient-bg py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            GAEL - Attendance System
          </h1>
          <p className="text-muted-foreground">
            Scan QR codes for quick student check-in
          </p>
        </div>

        {currentView === 'scanner' ? (
          <QRScanner onScan={handleQRScan} />
        ) : (
          <StudentInfo qrData={qrData} onBack={handleBackToScanner} />
        )}
      </div>
    </div>
  );
};

// This is the key fix - make sure you have a default export
export default Index;