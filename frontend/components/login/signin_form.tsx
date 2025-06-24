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
import { Step } from "./steps";
import { useLogin } from "@/hooks/login-hooks";
import { HTTP_SUCCESS } from "@/constants/http_code";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const { locale } = useLocale();
  const { login: login_func } = useLogin();
  const router = useRouter();
  const l = locale.login;
  const { afterLogin } = useAuth();

  const loginSchema = z.object({
    username: z.string().min(1, l.username_required).min(3, l.username_min),
    password: z.string().min(6, l.password_min).min(1, l.password_required),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const res = await login_func(data);
    if (res.code === HTTP_SUCCESS) {
      toast.success(l.signin_success);
      if (res.data) {
        afterLogin(res.data);
        router.push("/");
      }
    } else {
      toast.error(res.message || l.signin_failed);
    }
  };

  return (
    <Card className='mx-auto max-w-sm w-full shadow-md'>
      <CardHeader>
        <CardTitle className='text-2xl'>{l.signin_title}</CardTitle>
        <CardDescription>{l.signup_description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='grid gap-4'
        >
          <div className='grid gap-2'>
            <Label htmlFor='username'>{}</Label>
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
            <div className='flex items-center'>
              <Label htmlFor='password'>{l.password}</Label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (process.env.NEXT_PUBLIC_RELEASE_MODE === "true") {
                    router.push(`/login?step=${Step.ForgotPassword}`);
                  } else {
                    toast.error("试用版本不支持找回密码");
                  }
                }}
                className='ml-auto inline-block text-sm underline'
              >
                {l.forgot_password}
              </button>
            </div>
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
          <Button
            type='submit'
            className='w-full'
          >
            {l.submit}
          </Button>
        </form>
        <div className='mt-4 text-center text-sm'>
          {l.need_account}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (process.env.NEXT_PUBLIC_RELEASE_MODE === "true") {
                router.push(`/login?step=${Step.SignUp}`);
              } else {
                toast.error("试用版本不支持注册");
              }
            }}
            className='underline'
          >
            {l.register}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
