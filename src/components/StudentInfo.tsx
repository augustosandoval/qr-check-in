import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, Clock, CheckCircle, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  course: string;
  year: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastAttendance?: string;
  profileImage?: string;
}

interface StudentInfoProps {
  qrData: string;
  onBack: () => void;
}

export const StudentInfo = ({ qrData, onBack }: StudentInfoProps) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Mock function to simulate Supabase call
    const fetchStudentData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Parse QR data (assuming it contains student ID)
        const studentId = qrData;
        
        // Mock student data - replace with actual Supabase call later
        const mockStudent: Student = {
          id: studentId,
          name: "Alex Johnson",
          email: "alex.johnson@university.edu",
          studentId: studentId,
          course: "Computer Science",
          year: "3rd Year",
          phone: "+1 (555) 123-4567",
          status: "active",
          lastAttendance: "2024-01-30T10:30:00Z",
        };
        
        setStudent(mockStudent);
        
        // Mark attendance
        setTimeout(() => {
          setAttendanceMarked(true);
          toast({
            title: "Attendance Marked",
            description: `${mockStudent.name} has been marked present`,
            variant: "default",
          });
        }, 500);
        
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast({
          title: "Error",
          description: "Failed to load student information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [qrData, toast]);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 shadow-elegant">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading student information...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 shadow-elegant">
          <div className="text-center space-y-4">
            <div className="text-destructive">
              <User className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Student Not Found</h3>
              <p className="text-muted-foreground">The QR code does not match any student records.</p>
            </div>
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" />
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
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {attendanceMarked && (
              <Badge variant="secondary" className="bg-gradient-accent text-accent-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Present
              </Badge>
            )}
          </div>

          {/* Student Profile */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-primary">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              {attendanceMarked && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-accent rounded-full p-2 shadow-accent">
                  <CheckCircle className="h-6 w-6 text-accent-foreground" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-muted-foreground">ID: {student.studentId}</p>
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

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Course</p>
                  <p className="text-sm text-muted-foreground">{student.course} - {student.year}</p>
                </div>
              </div>

              {student.lastAttendance && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Last Attendance</p>
                    <p className="text-sm text-muted-foreground">{formatDate(student.lastAttendance)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Session */}
          <div className="text-center p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">Current Session</p>
            <p className="text-xs text-muted-foreground">{formatDate(new Date().toISOString())}</p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onBack} 
            variant="scanner" 
            size="xl" 
            className="w-full"
          >
            Scan Another Student
          </Button>
        </div>
      </Card>
    </div>
  );
};