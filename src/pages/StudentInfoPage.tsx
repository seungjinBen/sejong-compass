import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/common/Card';
import { useUserStore, useUIStore } from '@/store';
import { StudentInfoForm } from '@/components/forms/StudentInfoForm';

export function StudentInfoPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const showToast = useUIStore((s) => s.showToast);

  if (!profile) return null;

  return (
    <PageShell title="학생 정보 수정">
      <Card className="max-w-2xl">
        <StudentInfoForm
          withTranscript
          submitLabel="저장하기"
          onSaved={() => {
            showToast('학생 정보가 저장되었습니다');
            navigate('/dashboard');
          }}
        />
      </Card>
    </PageShell>
  );
}
