"use client";
import React, { Suspense } from "react";
import { Step } from "@/components/login/steps";
import { useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/login/signin_form";
import { SignUpForm } from "@/components/login/signup_form";
import { ForgotPasswordForm } from "@/components/login/forgot_password_form";
import { TitleEffect } from "@/components/login/title";

// Create a separate component that uses useSearchParams
const LoginContent = () => {
  const searchParams = useSearchParams();
  const step = Number((searchParams.get("step") ?? Step.SignIn) as Step);

  return (
    <div className='relative grid grid-cols-12 h-full w-full bg-primary-foreground '>
      <div className='col-span-5 max-md:col-span-full h-full flex-center'>
        <video
          autoPlay
          muted
          loop
          className='absolute z-0 object-cover object-center h-full w-full max-md:block hidden'
          src='/bg.mp4'
        />
        <div className='w-full flex flex-col gap-y-4 mx-2 '>
          <TitleEffect classname='z-10 max-md:block hidden  text-[2.4em] ' />
          <div className='w-full z-10'>
            {step === Step.SignIn && <SignInForm />}
            {step === Step.SignUp && <SignUpForm />}
            {step === Step.ForgotPassword && <ForgotPasswordForm />}
          </div>
        </div>
      </div>

      <div className='flex-center relative col-span-7 max-md:hidden h-full '>
        <TitleEffect classname='absolute z-10 -translate-y-[1.5em]' />
        <video
          autoPlay
          muted
          loop
          className='object-cover object-center h-full w-full'
          src='/bg.mp4'
        />
        <div className='absolute z-0 inset-0 bg-black/20 ' />
      </div>
    </div>
  );
};

// Main page component with Suspense boundary
const LoginPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
