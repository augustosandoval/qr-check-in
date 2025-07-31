import { useParams, useNavigate } from 'react-router-dom';
import { StudentInfo } from '@/components/StudentInfo';

const StudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-bg py-8 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Student ID</h1>
          <button 
            onClick={handleBack}
            className="text-primary hover:underline"
          >
            Return to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Student Information
          </h1>
          <p className="text-muted-foreground">
            Attendance check-in details
          </p>
        </div>

        <StudentInfo qrData={studentId} onBack={handleBack} />
      </div>
    </div>
  );
};

export default StudentDetail;