"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateKnowledgeBase } from '@/components/main/create-knowledge-base'
import { useAuth } from '@/hooks/use-auth'
import { useKnowledgeBase } from '@/contexts/knowledge-base-context'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import KBTab from '@/components/main/kb-tabs'

export default function MainPage() {
  const [mounted, setMounted] = React.useState(false)
  const { user, clearUp } = useAuth()
  const { kbs, isLoading, projs } = useKnowledgeBase()
  const [isProjKb, setIsProjKb] = React.useState(false)
  const queryClient = useQueryClient()
  const pathname = usePathname()
  
  React.useEffect(() => {
    setMounted(true)
    queryClient.invalidateQueries({ queryKey: ["userKbs"] })
  }, [])

  React.useEffect(() => {
    if (pathname === "/") {
      if (!user) {
        setTimeout(() => {
          clearUp()
          }, 1000)
        }
    }
  }, [user, pathname])
  
  if (!mounted || !user || isLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="container mx-auto py-4 px-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>欢迎回来, {user.username}</CardTitle>
            <div className="flex items-center gap-2">
              <CreateKnowledgeBase  isProjKb={isProjKb}  projects= {projs}onSuccess={() => {
                if (isProjKb) {
                  queryClient.invalidateQueries({ queryKey: ["userProjs"] });
                } else {
                  queryClient.invalidateQueries({ queryKey: ["userKbs"] });
                }
              }}/>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">今天我们要使用哪个知识库？</p>
        </CardContent>
      </Card>
      <div className="mt-4">
        <KBTab userKbs={kbs || []} projKbs={projs || []} setIsProjKb={setIsProjKb} />
      </div>
    </div>
  )
}
