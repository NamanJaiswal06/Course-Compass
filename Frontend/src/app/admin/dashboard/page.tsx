'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, LogOut, BookOpen, Search, RefreshCw } from 'lucide-react';
import { apiUploadCourses, apiGetAllCourses, apiSearchCourses, clearToken, getToken, type BackendCourse } from '@/lib/api';

// ─── Upload Card ──────────────────────────────────────────────────────────────

function CourseUploadCard({ onUploaded }: { onUploaded: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select a .csv file.' });
        setSelectedFile(null);
        event.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const result = await apiUploadCourses(selectedFile);
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" /> Success
          </div>
        ) as unknown as string,
        description: `${result.message} — ${result.count} courses added.`,
      });
      setSelectedFile(null);
      const fileInput = document.getElementById('course-csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      onUploaded(); // refresh the course list
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({ variant: 'destructive', title: 'Upload Failed', description: message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
          <FileText className="text-accent" /> Upload Course Data
        </CardTitle>
        <CardDescription>Upload a CSV file with course information (course_id, title, description, category, instructor, duration).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          id="course-csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading}
          className="file:text-primary file:font-semibold"
        />
        {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
          {isUploading ? 'Uploading...' : (<><Upload className="mr-2 h-4 w-4" /> Upload CSV</>)}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Course List Card ─────────────────────────────────────────────────────────

function CourseListCard({ refreshKey }: { refreshKey: number }) {
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchCourses = async (q?: string) => {
    setIsLoading(true);
    try {
      const data = q && q.trim() ? await apiSearchCourses(q) : await apiGetAllCourses();
      setCourses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch courses';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            <BookOpen className="text-accent" /> Course Database
            <span className="text-sm font-normal text-muted-foreground">({courses.length} courses)</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => fetchCourses(searchQ)} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCourses(searchQ)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => fetchCourses(searchQ)} disabled={isLoading}>Search</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No courses found. Upload a CSV to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-semibold text-primary">Title</th>
                  <th className="py-2 pr-4 font-semibold text-primary">Category</th>
                  <th className="py-2 pr-4 font-semibold text-primary">Instructor</th>
                  <th className="py-2 font-semibold text-primary">Duration</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-b hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-4">{course.title}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{course.category}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{course.instructor}</td>
                    <td className="py-2 text-muted-foreground">{course.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect to login if no token
  useEffect(() => {
    if (!getToken()) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'Please login first.' });
      router.push('/admin/login');
    }
  }, [router, toast]);

  const handleLogout = () => {
    clearToken();
    router.push('/admin/login');
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage course data from here.</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CourseUploadCard onUploaded={() => setRefreshKey((k) => k + 1)} />
        <CourseListCard refreshKey={refreshKey} />
      </div>
    </div>
  );
}
