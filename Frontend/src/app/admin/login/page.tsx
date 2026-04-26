'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Compass, LogIn } from 'lucide-react';
import { apiLogin, setToken } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiLogin(email, password);
      // Store the JWT token
      setToken(data.token);

      toast({
        title: 'Login Successful',
        description: 'Redirecting to dashboard...',
      });
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
             <div className="flex justify-center items-center gap-2 mb-2">
                <Compass className="h-10 w-10 text-accent" />
                <h1 className="font-headline text-3xl font-bold text-primary">Course Compass</h1>
             </div>
            <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={async () => {
                  if (!email || !password) {
                    toast({ variant: 'destructive', title: 'Please enter email and password first' });
                    return;
                  }
                  setIsLoading(true);
                  try {
                    const { apiSignup } = await import('@/lib/api');
                    const data = await apiSignup(email, password);
                    setToken(data.token);
                    toast({ title: 'Account created!', description: 'Redirecting to dashboard...' });
                    router.push('/admin/dashboard');
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Signup failed';
                    toast({ variant: 'destructive', title: 'Signup Failed', description: message });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Create admin account
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
