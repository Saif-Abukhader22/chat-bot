import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword } from '../services/authService';
import { Save, User as UserIcon, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPwLoading, setIsPwLoading] = useState(false);
  const { toast } = useToast();
  const { user, logout, refresh } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  useEffect(() => {
    if (open) {
      // Prefill profile data
      setDisplayName(user?.displayName || '');
      setEmail(user?.email || '');
    }
  }, [open, user]);

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const updated = await updateProfile({ displayName });
      // Refresh auth state so new display name is reflected across UI
      try { await refresh(); } catch {}
      toast({ title: 'Profile updated', description: 'Your display name was saved.' });
      onOpenChange(false);
    } catch (e: any) {
      console.error('Failed to update profile:', e);
      toast({ title: 'Update failed', description: e?.message || 'Could not save profile.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!oldPassword || !newPassword || !confirmPassword) {
        toast({ title: 'Missing fields', description: 'Please fill all password fields.', variant: 'destructive' });
        return;
      }
      if (newPwIssues.length > 0) {
        toast({ title: 'Weak password', description: newPwIssues.join(' • '), variant: 'destructive' });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: 'Passwords do not match', description: 'Confirm password must match new password.', variant: 'destructive' });
        return;
      }
      setIsPwLoading(true);
      await changePassword({ oldPassword, newPassword, confirmPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', description: 'Your password was changed successfully.' });
      // Close the settings dialog on success
      onOpenChange(false);
    } catch (e: any) {
      console.error('Failed to change password:', e);
      const code = (e?.code || '').toString();
      const field = (e?.body?.detail?.field || e?.field || '').toString();
      const issues: string[] = Array.isArray(e?.issues) ? e.issues : [];
      let description = (e?.message || '').toString();
      if (code === 'old_password_incorrect') {
        description = 'The current password you entered is incorrect.';
      } else if (code === 'passwords_do_not_match') {
        description = 'New password and confirmation do not match.';
      } else if (code === 'weak_password') {
        description = issues.length ? `Password requirements: ${issues.join(' • ')}` : 'New password does not meet requirements.';
      } else if (code === 'password_change_not_supported') {
        description = 'Password change is not available for this account.';
      } else if (code === 'update_failed') {
        description = 'Could not change password. Please try again later.';
      } else if (!description) {
        description = 'Could not change password.';
      }
      const title = code ? 'Password change error' : 'Change failed';
      toast({ title, description, variant: 'destructive' });
    } finally {
      setIsPwLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile
          </DialogTitle>
          <DialogDescription>
            View and update your account details.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Display Name</Label>
                  <Input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" value={email} disabled placeholder="Email" />
                  <p className="text-xs text-muted-foreground">Email changes are managed by support.</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="destructive" onClick={() => { logout(); window.location.href = '/login'; }}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handleSaveProfile} disabled={isLoading || !displayName.trim()} variant="gradient">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="password">
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Current Password</Label>
                  <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" />
                </div>
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
                  {confirmPassword && confirmPassword !== newPassword && (
                    <div className="text-xs text-red-600">Confirmation does not match the new password</div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handleChangePassword} disabled={isPwLoading || !oldPassword || !newPassword || !confirmPassword || newPwIssues.length > 0 || confirmPassword !== newPassword} variant="gradient">
                      {isPwLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
