import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConnectInstagram, useInstagramAccounts } from '@/api/instagram';
import { useCompleteOnboarding } from '@/api/me';
import { extractErrorMessage } from '@/api/client';
import { formatNumber } from '@/utils/format';
import { ROUTES } from '@/constants/routes';

export default function ConnectInstagramOnboardingPage() {
  const [searchParams] = useSearchParams();
  const { data: accounts, refetch } = useInstagramAccounts();
  const connect = useConnectInstagram();
  const completeOnboarding = useCompleteOnboarding();
  const navigate = useNavigate();

  const connectedAccount = accounts?.find((a) => a.status === 'CONNECTED');

  useEffect(() => {
    const connectedParam = searchParams.get('connected');
    if (connectedParam === 'true') {
      toast.success('Instagram connected!');
      refetch();
    } else if (connectedParam === 'false') {
      toast.error('Could not connect Instagram. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      await connect.mutateAsync();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleFinish = async () => {
    try {
      await completeOnboarding.mutateAsync();
      navigate(ROUTES.dashboard);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Connect Instagram</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with your Instagram Professional account (Business or Creator) to connect it.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-background/50 p-6">
        {connectedAccount ? (
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-success">
              <AvatarImage src={connectedAccount.profilePictureUrl ?? undefined} />
              <AvatarFallback>{connectedAccount.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <p className="font-medium">@{connectedAccount.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(connectedAccount.followersCount)} followers
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
              <Instagram className="h-6 w-6" />
            </span>
            <Button variant="gradient" onClick={handleConnect} loading={connect.isPending}>
              Connect Instagram Business account
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        {!connectedAccount && (
          <Button variant="ghost" onClick={handleFinish} loading={completeOnboarding.isPending}>
            Skip for now
          </Button>
        )}
        {connectedAccount && (
          <Button variant="gradient" className="w-full" onClick={handleFinish} loading={completeOnboarding.isPending}>
            Go to dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
