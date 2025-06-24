import { GetUserByIdResponse } from '@/interfaces/user';
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { useUserContext } from '@/contexts/user-context';

type ShowUserInfoProps = {
    user_id: string
    title?: string
}

const ShowUserInfo = ({user_id, title}: ShowUserInfoProps) => {
    const {getUserInfo} = useUserContext()
    const [userInfo, setUserInfo] = useState<GetUserByIdResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleClick = async () => {
        setIsLoading(true)
        try {
            const res = await getUserInfo(user_id)
            if(res) {
                setUserInfo(res)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button 
                    onClick={handleClick} 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                >
                    {isLoading ? '加载中...' : '查看'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">{title || '用户信息'}</DialogTitle>
                    <DialogDescription/>
                <div className="mt-4">
                    {isLoading ? (
                        <p className="text-gray-500">加载中...</p>
                    ) : userInfo ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">用户名:</span>
                                <span>{userInfo.user.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">邮箱:</span>
                                <span>{userInfo.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">手机号:</span>
                                <span>{userInfo.user.phone}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">未能获取用户信息</p>
                    )}
                </div>
                </DialogHeader>
            </DialogContent>
            
        </Dialog>
    )
}

export default ShowUserInfo