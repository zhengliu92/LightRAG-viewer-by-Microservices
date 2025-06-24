import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { KeyRound } from 'lucide-react'

const formSchema = z.object({
  password: z.string().min(6, '密码长度不能小于6'),
})

type FormValues = z.infer<typeof formSchema>

type ChangePasswordModalProps = {
  username: string
  onSubmit: (password: string) => void
}

const ChangePasswordModal = ({ onSubmit, username }: ChangePasswordModalProps) => {
  const [open, setOpen] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  })

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.password)
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-muted-foreground hover:text-foreground">
          <KeyRound className="w-4 h-4 mr-2" />
          修改密码
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[350px]">
        <DialogHeader>
          <DialogTitle>修改{username}的密码</DialogTitle>
          <DialogDescription/>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入新密码" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                确认修改
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </DialogHeader>

      </DialogContent>
    </Dialog>
  )
}

export default ChangePasswordModal