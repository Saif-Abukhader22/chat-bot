import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { resetPassword } from '../services/authService';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const nav = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const newPwIssues = passwordIssues(newPassword);
  const confirmMismatch = confirmPassword !== '' && newPassword !== confirmPassword;

  // No resend logic on reset page (moved to Forgot Password dialog)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!token) {
      setError('Missing or invalid reset token.');
      return;
    }
    if (newPwIssues.length > 0) {
      setError('Password requirements: ' + newPwIssues.join(' • '));
      return;
    }
    if (confirmMismatch) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setSubmitting(true);
      await resetPassword(token, newPassword);
      setSuccess('Password has been reset. You can now log in.');
      // Optionally redirect to login after a short delay
      setTimeout(() => nav('/login', { replace: true }), 1500);
    } catch (e: any) {
      const code = (e?.code || '').toString();
      const issues: string[] = Array.isArray(e?.issues) ? e.issues : [];
      let msg = (e?.message || '').toString();
      if (code === 'invalid_token') {
        msg = 'Reset link is invalid or has expired.';
      } else if (code === 'weak_password') {
        msg = issues.length ? `Password requirements: ${issues.join(' • ')}` : 'Password does not meet requirements.';
      }
      setError(msg || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend option was removed per updated flow.

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border border-border rounded-lg p-6 bg-card">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        {!token && (
          <div className="text-sm text-red-600">This link is missing a token. Please use the link from your email.</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
          <div className="text-xs mt-1 space-y-1">
            <div className="text-muted-foreground">Password must include:</div>
            <ul className="list-disc ml-5">
              <li className={newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}>At least 8 characters</li>
              <li className={!/\s/.test(newPassword) && newPassword ? 'text-green-600' : 'text-red-600'}>No spaces</li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-red-600'}>A lowercase letter (a-z)</li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-red-600'}>An uppercase letter (A-Z)</li>
              <li className={/\d/.test(newPassword) ? 'text-green-600' : 'text-red-600'}>A number (0-9)</li>
              <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-red-600'}>A symbol (!@#$%^&* etc.)</li>
            </ul>
            {newPwIssues.length > 0 && (
              <div className="text-red-600">{newPwIssues.length} requirement{newPwIssues.length > 1 ? 's' : ''} remaining</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
          {confirmMismatch && (
            <div className="text-xs text-red-600">Confirmation does not match the new password</div>
          )}
        </div>

        <Button type="submit" disabled={submitting || !token || !newPassword || !confirmPassword || newPwIssues.length > 0 || confirmMismatch} className="w-full">
          {submitting ? 'Resetting…' : 'Reset Password'}
        </Button>
        {/* Resend option removed; available in Forgot Password dialog */}
        <div className="text-sm text-muted-foreground">Remembered it? <Link className="text-primary" to="/login">Back to log in</Link></div>
      </form>
    </div>
  );
};

export default ResetPassword;
