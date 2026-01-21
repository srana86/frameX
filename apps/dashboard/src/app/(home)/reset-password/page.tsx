import Link from "next/link";
import AuthShell from "../_components/modules/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title='Set a new password'
      description='Choose a strong password to secure your tenant account and keep all store data protected.'
      benefits={[
        "Use at least 8 characters with numbers.",
        "Keep each store workspace protected.",
        "Change passwords anytime in settings.",
        "Support available if you get stuck.",
      ]}
      formTitle='Reset password'
      formDescription='Enter and confirm your new password to finish.'
      autoScrollToFormOnMobile
      footer={
        <span>
          Need to resend the link?{" "}
          <Link href='/forgot-password' className='font-semibold text-blue-600 hover:text-blue-700'>
            Go back
          </Link>
          .
        </span>
      }
    >
      <form className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-semibold text-slate-700'>
            New password
          </Label>
          <Input
            id='password'
            type='password'
            autoComplete='new-password'
            placeholder='Create a new password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-sm sm:text-base shadow-sm'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirm-password' className='text-sm font-semibold text-slate-700'>
            Confirm password
          </Label>
          <Input
            id='confirm-password'
            type='password'
            autoComplete='new-password'
            placeholder='Re-enter your password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-sm sm:text-base shadow-sm'
          />
        </div>
        <Button
          type='submit'
          className='h-11 w-full rounded-full bg-[#0448FD] text-sm sm:text-base font-semibold text-white hover:bg-[#0548FD]'
        >
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
