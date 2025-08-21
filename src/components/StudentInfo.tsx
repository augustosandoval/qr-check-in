import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, Clock, CheckCircle, Mail, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../lib/supabaseClient'; // Your supabase client

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  course?: string;
  year?: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastAttendance?: string;
  profileImage?: string;
  attendanceId?: string; // ID of the attendance record created
}

interface StudentInfoProps {
  qrData: string;
  onBack: () => void;
}

interface QRData {
  classId: string;
  className: string;
  studentName: string;
  studentId: string;
  date: string;
  window: number;
}

interface SupabaseAttendanceResponse {
  first_name: string;
  last_name: string;
  email: string;
  attendance_id: string | null;
  message: string;
}

export const StudentInfo = ({ qrData, onBack }: StudentInfoProps) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrInfo, setQrInfo] = useState<QRData | null>(null);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudentDataAndMarkAttendance = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Parse QR JSON data
        let parsedQRData: QRData;
        
        try {
          parsedQRData = JSON.parse(qrData);
          console.log('Parsed QR data:', parsedQRData);
        } catch (parseError) {
          throw new Error('Invalid QR code format - not valid JSON');
        }

        // Validate required fields
        if (!parsedQRData.studentId || !parsedQRData.classId) {
          throw new Error('QR code missing required studentId or classId');
        }

        setQrInfo(parsedQRData);

        console.log('Calling Supabase function with:', { 
          studentId: parsedQRData.studentId, 
          classId: parsedQRData.classId 
        });

        // Call Supabase function
        const { data, error } = await supabase.rpc('record_student_attendance', {
          p_student_id: parsedQRData.studentId,
          p_class_id: parsedQRData.classId
        });

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error('No data returned from database');
        }

        const result: SupabaseAttendanceResponse = data[0];
        console.log('Supabase response:', result);

        // Check if the function returned an error message
        if (!result.attendance_id) {
          setError(result.message);
          toast({
            title: "Check-in Failed",
            description: result.message,
            variant: "destructive",
          });
          return;
        }

        // Success - create student object from response
        const studentData: Student = {
          id: parsedQRData.studentId,
          name: `${result.first_name} ${result.last_name}`,
          email: result.email,
          studentId: parsedQRData.studentId,
          status: "active",
          attendanceId: result.attendance_id,
          lastAttendance: new Date().toISOString(), 
          profileImage: `https://dttczenkpmtejtugfivr.supabase.co/storage/v1/object/public/profiles/student/${parsedQRData.studentId}.jpg`,
        };
        
        setStudent(studentData);
        setAttendanceMarked(true);
        
        toast({
          title: "Attendance Marked Successfully!",
          description: `Welcome, ${result.first_name} ${result.last_name}!`,
          variant: "default",
        });
        
      } catch (error) {
        console.error('Error processing attendance:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        
        toast({
          title: "Check-in Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDataAndMarkAttendance();
  }, [qrData, toast]);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 shadow-elegant">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Processing check-in...</p>
            <p className="text-xs text-muted-foreground">Verifying student and marking attendance</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 shadow-elegant">
          <div className="text-center space-y-4">
            <div className="text-destructive">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Check-in Failed</h3>
              <p className="text-muted-foreground text-sm">
                {error || "Student information could not be retrieved"}
              </p>
            </div>
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="p-6 shadow-elegant">
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {attendanceMarked && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Present
              </Badge>
            )}
          </div>

          {/* Student Profile */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-primary overflow-hidden">
                {!imageError && student.profileImage ? (
                  <img
                    src={student.profileImage}
                    alt={`${student.name} profile`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-foreground" />
                )}
              </div>
              {attendanceMarked && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-muted-foreground">ID: {student.studentId}</p>
              {qrInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  Class: {qrInfo.className}
                </p>
              )}
              {student.attendanceId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Attendance ID: {student.attendanceId.substring(0, 8)}...
                </p>
              )}
            </div>
</div>

          {/* Student Details */}
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </div>

              {student.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{student.phone}</p>
                  </div>
                </div>
              )}

              {student.course && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Course</p>
                    <p className="text-sm text-muted-foreground">
                      {student.course} {student.year && `- ${student.year}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Check-in Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {qrInfo && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Class Information</p>
                    <p className="text-sm text-muted-foreground">
                      {qrInfo.className}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Date: {qrInfo.date} | Class ID: {qrInfo.classId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Success Message */}
          {attendanceMarked && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-800">Attendance Recorded</p>
              <p className="text-xs text-green-600">
                Student has been successfully marked as present
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button 
            onClick={onBack} 
            variant="default" 
            size="lg" 
            className="w-full"
          >
            Scan Another Student
          </Button>
        </div>
      </Card>
    </div>
  );
};