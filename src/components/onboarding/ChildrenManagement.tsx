import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  subjects: string[];
}

interface ChildrenManagementProps {
  onComplete: () => void;
}

export const ChildrenManagement = ({ onComplete }: ChildrenManagementProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [newChild, setNewChild] = useState({ 
    firstName: '', 
    lastName: '', 
    gradeLevel: ''
  });
  const [loading, setLoading] = useState(false);

  const gradeOptions = [
    { value: 'Pre-K', label: t('cm.grPreK') },
    { value: 'Kindergarten', label: t('cm.grKinder') },
    { value: '1st Grade', label: t('cm.gr1') },
    { value: '2nd Grade', label: t('cm.gr2') },
    { value: '3rd Grade', label: t('cm.gr3') },
    { value: '4th Grade', label: t('cm.gr4') },
    { value: '5th Grade', label: t('cm.gr5') },
    { value: '6th Grade', label: t('cm.gr6') },
    { value: '7th Grade', label: t('cm.gr7') },
    { value: '8th Grade', label: t('cm.gr8') },
    { value: '9th Grade', label: t('cm.gr9') },
    { value: '10th Grade', label: t('cm.gr10') },
    { value: '11th Grade', label: t('cm.gr11') },
    { value: '12th Grade', label: t('cm.gr12') },
  ];

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      const { data: children, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (error) throw error;

      const childrenData = children?.map(child => ({
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        grade_level: child.grade_level || '',
        subjects: child.subjects || []
      })) || [];

      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const addChild = async () => {
    if (!user || !newChild.firstName || !newChild.lastName || !newChild.gradeLevel) {
      toast({
        title: t('cm.error'),
        description: t('cm.fillNameGrade'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Insert directly into children table
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          first_name: newChild.firstName,
          last_name: newChild.lastName,
          grade_level: newChild.gradeLevel,
          subjects: []
        })
        .select()
        .single();

      if (childError) throw childError;

      setNewChild({ firstName: '', lastName: '', gradeLevel: '' });
      fetchChildren();
      toast({
        title: t('cm.childAdded'),
        description: `${newChild.firstName} ${t('cm.childAddedDesc')}`
      });
    } catch (error: any) {
      console.error('Error adding child:', error);
      toast({
        title: t('cm.error'),
        description: error.message || t('cm.failedAdd'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('cm.manageTitle')}
          </h1>
          <p className="text-muted-foreground">
            {t('cm.manageSub')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add New Child */}
          <Card className="bg-card border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('cm.addNew')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-foreground">{t('cm.firstName')}</Label>
                <Input
                  id="firstName"
                  value={newChild.firstName}
                  onChange={(e) => setNewChild(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-background border-input"
                  placeholder={t('cm.enterFirst')}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-foreground">{t('cm.lastName')}</Label>
                <Input
                  id="lastName"
                  value={newChild.lastName}
                  onChange={(e) => setNewChild(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-background border-input"
                  placeholder={t('cm.enterLast')}
                />
              </div>
              <div>
                <Label htmlFor="gradeLevel" className="text-foreground">{t('cm.gradeLevel')}</Label>
                <select
                  id="gradeLevel"
                  value={newChild.gradeLevel}
                  onChange={(e) => setNewChild(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  className="w-full p-2 bg-background border border-input text-foreground rounded-md"
                >
                  <option value="">{t('cm.selectGrade')}</option>
                  {gradeOptions.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={addChild}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? t('cm.adding') : t('cm.addChild')}
              </Button>
            </CardContent>
          </Card>

          {/* Children List */}
          <Card className="bg-card border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('cm.yourChildren')} ({children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('cm.noChildren')}</p>
                  <p className="text-sm">{t('cm.addFirst')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div 
                      key={child.id}
                      className="p-4 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full">
                          <UserCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {child.grade_level && `${t('cm.gradePrefix')} ${child.grade_level}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button 
            onClick={onComplete}
            className="bg-primary hover:bg-primary/90 px-8"
          >
            {t('cm.continueDashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
};