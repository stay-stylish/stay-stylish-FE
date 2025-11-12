'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    nickname: '',
    preferredStyle: '',
    gender: '',
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        preferredStyle: user.preferredStyle || '',
        gender: user.gender || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      setError('');
      if (user) {
        await updateUser({
          ...user,
          ...formData,
        });
      }
      router.push('/profile');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(
        err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // '뒤로가기' 안정성 강화
  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/profile');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          뒤로 가기
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-slate-900">프로필 수정</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nickname: e.target.value }))
                }
                placeholder="닉네임을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredStyle">선호 스타일</Label>
              <div className="flex flex-wrap gap-2">
                {['캐주얼', '클래식', '스트릿', '스포티', '미니멀'].map(
                  (style) => (
                    <Button
                      key={style}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          preferredStyle: style,
                        }));
                        setShowCustomInput(false);
                      }}
                      className={
                        formData.preferredStyle === style && !showCustomInput
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : ''
                      }
                    >
                      {style}
                    </Button>
                  )
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomInput(true)}
                  className={showCustomInput ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                >
                  직접 입력
                </Button>
              </div>
              {showCustomInput && (
                <Input
                  id="preferredStyle"
                  value={formData.preferredStyle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferredStyle: e.target.value,
                    }))
                  }
                  placeholder="선호하는 스타일을 입력하세요"
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">성별</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남성">남성</SelectItem>
                  <SelectItem value="여성">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <div className="mt-4 text-sm text-red-500">{error}</div>}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
