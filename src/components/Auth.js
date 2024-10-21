import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Auth({ type = 'signin' }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(error.error_description || error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">{type === 'signin' ? 'Sign In' : 'Sign Up'} to The Thing</h1>
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <Input
          className="mb-4"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          className="w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading' : 'Send magic link'}
        </Button>
      </form>
    </div>
  );
}
