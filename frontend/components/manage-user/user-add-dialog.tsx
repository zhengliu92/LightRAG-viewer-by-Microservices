import React, { useState } from 'react'
import { Button } from '../ui/button'
import { useRegister } from '@/hooks/login-hooks'
import { Input } from '../ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
    DialogHeader,
} from "@/components/ui/dialog"

const formSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(2, '用户名至少2个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const UserAddDialog = () => {
    const [open, setOpen] = useState(false)
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            username: '',
            password: '',
            phone: '',
        },
    })
    const queryClient = useQueryClient()

    const { register, loading } = useRegister()

    const onSubmit = async (values: FormValues) => {
        try {
            await register(values)
            toast.success('用户创建成功')
            form.reset()
            setOpen(false)
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['usersWithProjects'] })
            }, 300);
        } catch (error) {
            toast.error('创建用户失败')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>添加用户</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>添加用户</DialogTitle>
                <DialogDescription/>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>邮箱</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入邮箱" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>用户名</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入用户名" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>密码</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="请输入密码" autoComplete="new-password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>手机号码 (选填)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入手机号码" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? '创建中...' : '创建'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default UserAddDialog