import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, UserPlus, Trash2 } from 'lucide-react';

type StaffRole = 'principal' | 'vice_principal' | 'registrar' | 'accountant';
interface StaffRow { id: string; email: string; full_name: string | null; staff_role: StaffRole; is_active: boolean; }

const roleLabels: Record<StaffRole, string> = {
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  registrar: 'Registrar',
  accountant: 'Accountant',
};

const rolePermissions: Record<StaffRole, string> = {
  principal: 'Full access except billing',
  vice_principal: 'Academics + people, no billing/settings',
  registrar: 'Students, sections, attendance, report cards',
  accountant: 'Billing and fees only',
};

export const StaffManagement = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('registrar');

  useEffect(() => {
    if (!user) return;
    supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) { setSchoolId(data.id); load(data.id); } });
  }, [user]);

  const load = async (sid: string) => {
    const { data } = await supabase.from('school_staff').select('*').eq('school_id', sid).order('created_at', { ascending: false });
    setStaff((data || []) as StaffRow[]);
  };

  const add = async () => {
    if (!schoolId || !email) return;
    const { error } = await supabase.from('school_staff').insert({
      school_id: schoolId, email: email.trim(), full_name: name.trim() || null, staff_role: role,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Staff added');
    setEmail(''); setName('');
    load(schoolId);
  };

  const remove = async (id: string) => {
    if (!schoolId) return;
    const { error } = await supabase.from('school_staff').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load(schoolId);
  };

  const toggle = async (id: string, is_active: boolean) => {
    if (!schoolId) return;
    await supabase.from('school_staff').update({ is_active: !is_active }).eq('id', id);
    load(schoolId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Staff & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@school.edu" /></div>
            <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {(Object.keys(roleLabels) as StaffRole[]).map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button onClick={add} className="w-full"><UserPlus className="h-4 w-4 mr-1" />Add Staff</Button></div>
          </div>
          <p className="text-xs text-muted-foreground">{rolePermissions[role]}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Staff ({staff.length})</CardTitle></CardHeader>
        <CardContent>
          {staff.length === 0 ? <p className="text-sm text-muted-foreground">No staff added yet.</p> : (
            <div className="divide-y divide-border border border-border rounded-lg">
              {staff.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 gap-2">
                  <div>
                    <div className="font-medium">{s.full_name || s.email}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{roleLabels[s.staff_role]}</Badge>
                    <Badge variant={s.is_active ? 'default' : 'outline'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => toggle(s.id, s.is_active)}>{s.is_active ? 'Disable' : 'Enable'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
