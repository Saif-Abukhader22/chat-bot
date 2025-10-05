import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { verifyRegistration, sendVerificationCode } from '../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Signup = () => {
  const { signup, login, user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isloading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [resendIn, setResendIn] = useState(30);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const passwordIssues = (pwd: string): string[] => {
    const issues: string[] = [];
    if (!pwd || pwd.length < 8) issues.push('Must be at least 8 characters long');
    if (/\s/.test(pwd)) issues.push('Remove spaces; password cannot contain whitespace');
    if (!/[a-z]/.test(pwd)) issues.push('Add a lowercase letter (a-z)');
    if (!/[A-Z]/.test(pwd)) issues.push('Add an uppercase letter (A-Z)');
    if (!/\d/.test(pwd)) issues.push('Add a number (0-9)');
    if (!/[^A-Za-z0-9]/.test(pwd)) issues.push('Add a symbol (!@#$%^&* etc.)');
    return issues;
  };

  const pwErrs = passwordIssues(password);
  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const emailTrim = email.trim();
      if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
        setError('Enter a valid email (must include @ and .)');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (pwErrs.length || !name.trim()) {
        setError('Please complete the password requirements and name.');
        return;
      }
      const resp: any = await signup(emailTrim.toLowerCase(), name.trim(), password);
      // If backend requires verification, show modal instead of navigating
      const status = resp?.status || resp?.detail?.status;
      if (status === 'verification_sent') {
        setShowVerify(true);
        setVerifyMessage('A verification code was sent to your email.');
        setResendIn(30);
        try {
          if (resp?.debug?.verificationCode) {
            console.log(resp.debug.verificationCode);
          }
        } catch {}
        return;
      }
      // If token/user was returned (auto-login scenario), go to chat
      nav('/chat', { replace: true });
    } catch (e: any) {
      const status = e?.status as number | undefined;
      const msg = (e?.message || '').toString().toLowerCase();
      // Heuristics to provide a clear, actionable message
      if (status === 409 || msg.includes('already') || msg.includes('exists') || msg.includes('duplicate') || msg.includes('taken')) {
        setError('Email is already registered. Try logging in or use a different email.');
      } else if (status === 400 && (msg.includes('invalid') && msg.includes('email'))) {
        setError('Invalid email address. Please check the format.');
      } else if (msg.includes('password')) {
        setError('Password does not meet requirements. See the checklist above.');
      } else if (status && status >= 500) {
        setError('Server error during signup. Please try again later.');
      } else if (msg) {
        // Surface backend-provided detail if available
        setError(`Signup failed: ${e.message}`);
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect to chat immediately
  if (!loading && user) {
    nav('/chat', { replace: true });
    return null;
  }

  // Resend countdown timer
  useEffect(() => {
    if (!showVerify) return;
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [showVerify, resendIn]);

  const onResend = async () => {
    try {
      setVerifyMessage(null);
      const data = await sendVerificationCode(email.trim().toLowerCase());
      setVerifyMessage('New code sent. Check your email.');
      setResendIn(30);
      try {
        if (data?.debug?.verificationCode) {
          console.log(data.debug.verificationCode);
        }
      } catch {}
    } catch (e: any) {
      setVerifyMessage(e?.message || 'Failed to resend code.');
    }
  };

  const onVerify = async () => {
    try {
      setVerifyMessage(null);
      await verifyRegistration(email.trim().toLowerCase(), verifyCode.trim());
      // Auto-login now that email is verified
      try {
        await login(email.trim().toLowerCase(), password);
        setShowVerify(false);
        nav('/chat', { replace: true });
        return;
      } catch {
        // If auto-login fails, navigate to login page
        setShowVerify(false);
        nav('/login', { replace: true });
        return;
      }
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border border-border rounded-lg p-6 bg-card">
        <h1 className="text-xl font-semibold">Sign Up</h1>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="text-xs mt-1 space-y-1">
            <div className="text-muted-foreground">Password must include:</div>
            <ul className="list-disc ml-5">
              <li className={password.length >= 8 ? 'text-green-600' : 'text-red-600'}>At least 8 characters</li>
              <li className={!/\s/.test(password) && password ? 'text-green-600' : 'text-red-600'}>No spaces</li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}>A lowercase letter (a-z)</li>
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}>An uppercase letter (A-Z)</li>
              <li className={/\d/.test(password) ? 'text-green-600' : 'text-red-600'}>A number (0-9)</li>
              <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}>A symbol (!@#$%^&* etc.)</li>
            </ul>
            {/* Only bullets shown per requirement; no summary line */}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {confirmPassword.length > 0 && (
            <div className={`text-xs ${confirmMismatch ? 'text-red-600' : 'text-green-600'}`}>
              {confirmMismatch ? 'Passwords do not match' : 'Passwords match'}
            </div>
          )}
        </div>
        <Button type="submit" disabled={loading || pwErrs.length > 0 || !name.trim() || confirmMismatch || confirmPassword.length === 0} className="w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        <div className="text-sm text-muted-foreground">Have an account? <Link className="text-primary" to="/login">Log in</Link></div>
      </form>
      <Dialog open={showVerify} onOpenChange={setShowVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
            <DialogDescription>
              We sent a 6-digit code to {email || 'your email'}. Enter it below to activate your account.
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
                <Button type="button" variant="outline" disabled={resendIn > 0} onClick={onResend}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </Button>
                <Button type="button" onClick={onVerify} disabled={verifyCode.trim().length !== 6}>Verify</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;
