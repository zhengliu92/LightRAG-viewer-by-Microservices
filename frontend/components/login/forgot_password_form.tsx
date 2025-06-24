"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/hooks/use-locale";
import { UnImplement } from "../unimplement";

// Define the Zod validation schema for forgot password form
export function ForgotPasswordFormCard() {
  const { locale } = useLocale();
  const login_locale = locale.login;

  const forgotPasswordSchema = z.object({
    email: z
      .string()
      .email(login_locale.email_invalid)
      .min(1, login_locale.email_required),
  });

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    console.log("Password reset requested with email:", data.email);
  };

  return (
    <Card className='mx-auto max-w-sm w-full shadow-md'>
      <CardHeader>
        <CardTitle className='text-2xl'>
          {login_locale.forgot_password_title}
        </CardTitle>
        <CardDescription>
          {login_locale.forgot_password_description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='grid gap-4'
        >
          <div className='grid gap-2'>
            <Label htmlFor='email'>{login_locale.email}</Label>
            <Input
              id='email'
              type='email'
              placeholder={login_locale.email_placeholder}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <div className='text-sm text-red-500'>{errors.email.message}</div>
            )}
          </div>
          <Button
            type='submit'
            className='w-full'
          >
            {login_locale.confirm}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm'>
          {login_locale.already_account}
          <Link
            href='/login'
            className='underline'
          >
            {login_locale.login_here}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function ForgotPasswordForm() {
  if (process.env.NEXT_PUBLIC_RELEASE_MODE === "true") {
    return (
      <div className='w-full h-full flex-center'>
        <ForgotPasswordFormCard />
      </div>
    );
  }
  return <UnImplement name="找回密码" />;
}
