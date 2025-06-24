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
import { useRegister } from "@/hooks/login-hooks";
import { toast } from "sonner";
import { HTTP_CONFLECT, HTTP_SUCCESS } from "@/constants/http_code";
import { useRouter } from "next/navigation";
import { UnImplement } from "../unimplement";

export function SignUpFormContent() {
  const { register: register_func } = useRegister();
  const { locale } = useLocale();
  const router = useRouter();

  const l = locale.login;

  const registerSchema = z
    .object({
      username: z.string().min(1, l.username_required).min(3, l.username_min),
      email: z.string().email(l.email_invalid).min(1, l.email_required),
      password: z.string().min(6, l.password_min).min(1, l.password_required),
      confirmPassword: z.string().min(1, l.confirm_password_required),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
      if (confirmPassword !== password) {
        ctx.addIssue({
          code: "custom",
          message: l.password_mismatch,
          path: ["confirmPassword"],
        });
      }
    });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const res = await register_func(data);
    if (res.code === HTTP_SUCCESS) {
      toast.success(l.signup_success);
      router.push("/login");
    } else if (res.code === HTTP_CONFLECT) {
      toast.error(l.signup_conflect);
    } else {
      toast.error(l.signup_failed);
    }
  };

  return (
    <Card className='mx-auto max-w-sm w-full shadow-md'>
      <CardHeader>
        <CardTitle className='text-2xl'>{l.signup_title}</CardTitle>
        <CardDescription>{l.signup_description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='grid gap-4'
        >
          <div className='grid gap-2'>
            <Label htmlFor='username'>{l.username}</Label>
            <Input
              id='username'
              placeholder={l.username_placeholder}
              {...register("username")}
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <div className='text-sm text-red-500'>
                {errors.username.message}
              </div>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>{l.email}</Label>
            <Input
              id='email'
              type='email'
              placeholder={l.email_placeholder}
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <div className='text-sm text-red-500'>{errors.email.message}</div>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='password'>{l.password}</Label>
            <Input
              id='password'
              type='password'
              placeholder={l.password_placeholder}
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <div className='text-sm text-red-500'>
                {errors.password.message}
              </div>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='confirmPassword'>{l.confirm_password}</Label>
            <Input
              id='confirmPassword'
              type='password'
              placeholder={l.confirm_password_placeholder}
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <div className='text-sm text-red-500'>
                {errors.confirmPassword.message}
              </div>
            )}
          </div>
          <Button
            type='submit'
            className='w-full'
          >
            {l.register}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm'>
          {l.already_account}
          <Link
            href='/login'
            className='underline'
          >
            {l.login_here}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function SignUpForm() {
  if (process.env.NEXT_PUBLIC_RELEASE_MODE === "true") {
    return (
      <div className='w-full h-full flex-center'>
        <SignUpFormContent />
      </div>
    );
  }
  return <UnImplement name="注册" />;
}


