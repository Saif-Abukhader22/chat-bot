import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { verifyRegistration, sendVerificationCode, forgotPassword } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Login = () => {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isloading, setIsloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [resendIn, setResendIn] = useState(30);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotResendIn, setForgotResendIn] = useState(0);
  const [isForgotResending, setIsForgotResending] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (!showVerify) return;
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [showVerify, resendIn]);

  // Forgot-password resend timer
  useEffect(() => {
    if (!showForgot) return;
    if (forgotResendIn <= 0) return;
    const t = setInterval(() => setForgotResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [showForgot, forgotResendIn]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsloading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      nav('/chat', { replace: true });
    } catch (e: any) {
      const code = e?.code as string | undefined;
      const statusText = e?.statusText as string | undefined;
      if (code === 'email_not_confirmed' || statusText === 'verification_required' || /email_not_confirmed/i.test(e?.message || '')) {
        setShowVerify(true);
        setVerifyMessage('We sent a verification code to your email.');
        setResendIn(30);
        setError(null);
        try {
          const body: any = e?.body;
          const v = (body?.detail?.debug?.verificationCode) || (body?.debug?.verificationCode);
          if (v) console.log(v);
        } catch {}
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setIsloading(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email.trim());
    setForgotError(null);
    setForgotStatus(null);
    setShowForgot(true);
  };

  const handleSendReset = async () => {
    const em = forgotEmail.trim().toLowerCase();
    if (!em || !em.includes('@') || !em.includes('.')) {
      setForgotError('Enter a valid email (must include @ and .)');
      return;
    }
    setIsForgotLoading(true);
    setForgotError(null);
    setForgotStatus(null);
    try {
      await forgotPassword(em);
      setForgotStatus('If an account exists, a reset link has been sent.');
      setForgotResendIn(10);
    } catch (e: any) {
      setForgotError(e?.message || 'Failed to send reset link.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResendReset = async () => {
    const em = forgotEmail.trim().toLowerCase();
    if (!em || !em.includes('@') || !em.includes('.')) {
      setForgotError('Enter a valid email (must include @ and .)');
      return;
    }
    setIsForgotResending(true);
    setForgotError(null);
    try {
      await forgotPassword(em);
      setForgotStatus('A new reset link was sent to your email.');
      setForgotResendIn(10);
    } catch (e: any) {
      setForgotError(e?.message || 'Failed to resend reset link.');
    } finally {
      setIsForgotResending(false);
    }
  };

  // If already authenticated, redirect to chat immediately
  if (!isloading && user) {
    nav('/chat', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border border-border rounded-lg p-6 bg-card">
        <h1 className="text-xl font-semibold">Log In</h1>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center justify-end -mt-2">
          <button type="button" className="text-sm text-primary underline" onClick={openForgot}>Forgot password?</button>
        </div>
        <Button type="submit" disabled={isloading} className="w-full">{isloading ? 'Logging in...' : 'Log In'}</Button>
        <div className="text-sm text-muted-foreground">No account? <Link className="text-primary" to="/signup">Sign up</Link></div>
      </form>
      {/* Forgot password dialog */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email to receive a reset link.
            </DialogDescription>
          </DialogHeader>
          {forgotStatus && <div className="text-sm text-green-600">{forgotStatus}</div>}
          {forgotError && <div className="text-sm text-red-600">{forgotError}</div>}
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Button type="button" variant="secondary" onClick={() => setShowForgot(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleSendReset} disabled={isForgotLoading || !forgotEmail.trim()} variant="gradient">
                {isForgotLoading ? 'Sending…' : 'Send reset link'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Didn’t get the email?</div>
              <Button type="button" variant="outline" size="sm" onClick={handleResendReset} disabled={!forgotEmail.trim() || isForgotResending || forgotResendIn > 0}>
                {forgotResendIn > 0 ? `Resend in ${forgotResendIn}s` : (isForgotResending ? 'Sending…' : 'Resend email')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showVerify} onOpenChange={setShowVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
            <DialogDescription>
              We sent a 6-digit code to {email || 'your email'}. Enter it below to continue.
            </DialogDescription>
          </DialogHeader>
          {verifyMessage && <div className="text-sm mb-2 text-muted-foreground">{verifyMessage}</div>}
          <div className="flex flex-col items-center gap-4">
            <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex w-full items-center justify-between">
              <Button type="button" variant="secondary" onClick={() => { setShowVerify(false); }}>
                Change email
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" disabled={resendIn > 0} onClick={async () => {
                  try {
                    setVerifyMessage(null);
                    const data = await sendVerificationCode(email.trim().toLowerCase());
                    setVerifyMessage('New code sent. Check your email.');
                    setResendIn(30);
                    try {
                      if (data?.debug?.verificationCode) console.log(data.debug.verificationCode);
                    } catch {}
                  } catch (e: any) {
                    setVerifyMessage(e?.message || 'Failed to resend code.');
                  }
                }}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </Button>
                <Button type="button" onClick={async () => {
                  try {
                    setVerifyMessage(null);
                    await verifyRegistration(email.trim().toLowerCase(), verifyCode.trim());
                    // After verifying, try logging in again automatically
                    await login(email.trim(), password);
                    setShowVerify(false);
                    nav('/chat', { replace: true });
                  } catch (e: any) {
                    const msg = (e?.message || '').toString();
                    if (/invalid_verification_code/i.test(msg)) {
                      setVerifyMessage('The code you entered is incorrect.');
                    } else if (/expired_verification_code/i.test(msg)) {
                      setVerifyMessage('The code has expired. Please resend a new code.');
                    } else if (msg) {
                      setVerifyMessage(msg);
                    } else {
                      setVerifyMessage('Verification failed. Please try again.');
                    }
                  }
                }} disabled={verifyCode.trim().length !== 6}>Verify</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
