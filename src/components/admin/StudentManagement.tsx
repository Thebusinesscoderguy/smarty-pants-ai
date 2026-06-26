import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Loader2, ChevronRight, GraduationCap, Users, Camera, KeyRound, Copy, X } from 'lucide-react';
import { BulkStudentImport } from '@/components/admin/BulkStudentImport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SectionWithStudents {
  id: string;
  grade_level: string;
  section_name: string;
  students: { id: string; student_id: string; display_name: string; avatar_url: string | null }[];
}

interface CreatedCredential {
  email: string;
  password: string;
  generated: boolean;
}

// Admin-provisioned student creation (direct, server-side, pre-confirmed accounts).
// The legacy invitation-link flow (student_invitations) is intentionally no longer
// surfaced here; students now log in immediately with admin-provided credentials.
export const StudentManagement = () => {
  const [sections, setSections] = useState<SectionWithStudents[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [lastCreated, setLastCreated] = useState<CreatedCredential | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchData();
  }, [user]);

  const getSchoolAccount = async () => {
    if (!user) throw new Error('No user found');

    const { data: schoolData, error: schoolError } = await supabase
      .from('school_accounts')
      .select('id, school_name')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (schoolError) throw new Error(`Failed to fetch school account: ${schoolError.message}`);

    if (!schoolData) {
      const { data: newSchool, error: createError } = await supabase
        .from('school_accounts')
        .insert({
          admin_user_id: user.id,
          school_name: 'My School',
          plan_type: 'school',
          student_limit: 1000,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw new Error('Failed to create school account');
      return newSchool;
    }

    return schoolData;
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const schoolData = await getSchoolAccount();

      const { data: sectionData } = await supabase
        .from('school_sections')
        .select('*')
        .eq('school_id', schoolData.id)
        .order('grade_level', { ascending: true })
        .order('section_name', { ascending: true });

      if (sectionData && sectionData.length > 0) {
        const { data: assignments } = await supabase
          .from('section_students')
          .select('id, section_id, student_id')
          .in('section_id', sectionData.map((s) => s.id));

        const studentIds = [...new Set((assignments || []).map((a) => a.student_id))];
        const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
        if (studentIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', studentIds);
          (profiles || []).forEach((p) => {
            profileMap[p.id] = { name: p.display_name || 'Unknown', avatar_url: (p as any).avatar_url || null };
          });
        }

        const enriched: SectionWithStudents[] = sectionData.map((sec) => ({
          id: sec.id,
          grade_level: sec.grade_level,
          section_name: sec.section_name,
          students: (assignments || [])
            .filter((a) => a.section_id === sec.id)
            .map((a) => ({
              id: a.id,
              student_id: a.student_id,
              display_name: profileMap[a.student_id]?.name || 'Unknown',
              avatar_url: profileMap[a.student_id]?.avatar_url || null,
            })),
        }));
        setSections(enriched);
      } else {
        setSections([]);
      }
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || 'Failed to load students', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createStudent = async () => {
    if (!email.trim()) {
      toast({ title: t('common.error'), description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!lastName.trim()) {
      toast({ title: t('common.error'), description: 'Last name is required', variant: 'destructive' });
      return;
    }
    if (password && password.length < 8) {
      toast({ title: t('common.error'), description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    try {
      setIsCreating(true);
      const { data, error } = await supabase.functions.invoke('admin-create-student', {
        body: {
          email: email.trim().toLowerCase(),
          first_name: firstName.trim(),
          middle_name: middleName.trim() || undefined,
          last_name: lastName.trim(),
          password: password.trim() || undefined,
        },
      });
      const res = data as { ok?: boolean; email?: string; password?: string; generated?: boolean; error?: string; code?: string } | null;
      if (error && !res?.error) throw error;
      if (res?.code === 'email_exists') {
        toast({ title: 'Already exists', description: 'This email already has an account.', variant: 'destructive' });
        return;
      }
      if (!res?.ok) {
        toast({ title: 'Could not create student', description: res?.error || 'Please try again.', variant: 'destructive' });
        return;
      }

      setLastCreated({ email: res.email || email.trim(), password: res.password || '', generated: !!res.generated });
      toast({ title: 'Student created', description: `${res.email} can now log in.` });
      setEmail('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setPassword('');
      fetchData();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || 'Failed to create student', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const copyCredentials = () => {
    if (!lastCreated) return;
    navigator.clipboard?.writeText(`${lastCreated.email} / ${lastCreated.password}`);
    toast({ title: 'Copied', description: 'Credentials copied to clipboard.' });
  };

  const handleAvatarUpload = async (studentId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${studentId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('student-avatars').getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl } as any)
        .eq('id', studentId);
      if (updateError) throw updateError;

      toast({ title: 'Photo Updated', description: 'Student photo has been uploaded successfully.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">{t('adminStudentManagement.loadingStudents')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('adminStudentManagement.title')}</h2>
        <p className="text-muted-foreground">
          Create student accounts directly — they can log in immediately with their email and password.
        </p>
      </div>

      {/* Students by Section */}
      {sections.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Students by Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sections.map((section) => {
              const label = `${section.grade_level}${section.section_name ? ` ${section.section_name}` : ''}`;
              const isExpanded = expandedSection === section.id;
              return (
                <div key={section.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{label}</span>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {section.students.length} students
                      </Badge>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      {section.students.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">No students assigned to this section yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {section.students.map((student) => (
                            <div key={student.id} className="flex items-center gap-3 p-2 rounded-md bg-card border border-border">
                              <div className="relative group">
                                {student.avatar_url ? (
                                  <img src={student.avatar_url} alt={student.display_name} className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                                    {student.display_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                  <Camera className="h-3 w-3 text-white" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleAvatarUpload(student.student_id, file);
                                    }}
                                  />
                                </label>
                              </div>
                              <span className="text-sm font-medium text-foreground">{student.display_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Create Student Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Student
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="student@school.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <Input placeholder="Last name *" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Password (optional — leave blank to auto-generate)</Label>
              <Input
                placeholder="Auto-generated if blank"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <Button onClick={createStudent} disabled={isCreating || !email.trim() || !lastName.trim()}>
            {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            {isCreating ? 'Creating...' : 'Create Student'}
          </Button>

          {lastCreated && (
            <Alert className="relative">
              <KeyRound className="h-4 w-4" />
              <button
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                onClick={() => setLastCreated(null)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Account created — share these credentials:</p>
                  <p className="font-mono text-sm">
                    {lastCreated.email}<br />
                    {lastCreated.password}
                  </p>
                  {lastCreated.generated && (
                    <p className="text-xs text-muted-foreground">Auto-generated password. This is the only time it is shown.</p>
                  )}
                  <Button size="sm" variant="outline" className="mt-2" onClick={copyCredentials}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <BulkStudentImport />
    </div>
  );
};
