import Link from "next/link";
import AuthShell from "../_components/modules/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <AuthShell
      title='Create your tenant account'
      description='Create one account to manage multiple stores, products, orders, and payments from a single workspace.'
      benefits={[
        "Add new stores anytime under one login.",
        "Monitor sales and operations across stores.",
        "Manage inventory, pricing, and promotions.",
        "Access growth tools built for multi-store teams.",
      ]}
      formTitle='Tenant registration'
      formDescription='Use your email and choose a strong password to begin.'
      autoScrollToFormOnMobile
      footer={
        <span>
          Already have an account?{" "}
          <Link href='/login' className='font-semibold text-blue-600 hover:text-blue-700'>
            Sign in
          </Link>
          .
        </span>
      }
    >
      <form className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='name' className='text-sm font-semibold text-slate-700'>
            Full name
          </Label>
          <Input
            id='name'
            type='text'
            autoComplete='name'
            placeholder='Tenant owner name'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
            Email
          </Label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='tenant@yourstore.com'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-semibold text-slate-700'>
            Password
          </Label>
          <Input
            id='password'
            type='password'
            autoComplete='new-password'
            placeholder='Create a password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
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
            placeholder='Re-enter password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
          />
        </div>
        <label className='flex items-start gap-2 text-xs text-slate-500'>
          <input
            type='checkbox'
            required
            className='mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40'
          />
          I agree to the FrameX Tech terms, privacy policy, and tenant account guidelines.
        </label>
        <Button
          type='submit'
          className='h-11 w-full rounded-full bg-[#0448FD] text-base font-semibold text-white hover:bg-[#0548FD]'
        >
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
