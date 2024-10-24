"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const createUserEntry = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, email: email }]);

    if (error) {
      console.error('Error creating user entry:', error);
      setMessage('Account created, but there was an error setting up your profile. Please contact support.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      await createUserEntry(data.user.id);
      setMessage('Account created successfully! Check your email for the confirmation link.');
      router.push('/signin');
    } else {
      setMessage('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Sign Up for The Thing</h1>
      <form onSubmit={handleSignUp} className="w-full max-w-sm">
        <Input
          className="mb-4"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          className="mb-4"
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          className="w-full mb-4"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
      {message && (
        <p className={`mt-4 ${message.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
      <p className="mt-4">
        Already have an account? <Link href="/signin" className="text-blue-500 hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
