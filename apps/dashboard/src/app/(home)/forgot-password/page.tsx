import Link from "next/link";
import AuthShell from "../_components/modules/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title='Reset your merchant password'
      description='Enter the email linked to your merchant account. We will send a reset link to help you regain access.'
      benefits={[
        "Secure, time-limited reset links.",
        "Get back to managing all your stores quickly.",
        "Support team ready if you need help.",
        "Your data stays protected end-to-end.",
      ]}
      formTitle='Forgot password'
      formDescription='We will email you a secure link to reset your password.'
      autoScrollToFormOnMobile
      footer={
        <span>
          Remembered your password?{" "}
          <Link href='/login' className='font-semibold text-blue-600 hover:text-blue-700'>
            Back to login
          </Link>
          .
        </span>
      }
    >
      <form className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
            Email
          </Label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='merchant@yourstore.com'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-sm sm:text-base shadow-sm'
          />
        </div>
        <Button
          type='submit'
          className='h-11 w-full rounded-full bg-[#0448FD] text-sm sm:text-base font-semibold text-white hover:bg-[#0548FD]'
        >
          Send reset link
        </Button>
        <p className='text-xs text-slate-500'>
          If your email is registered, you will receive a reset link within a few minutes.
        </p>
      </form>
    </AuthShell>
  );
}
