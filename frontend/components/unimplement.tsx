import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function UnImplement({ name }: { name: string }) {
  const router = useRouter();
  return (  
    <div className='w-full h-full flex-center flex-col gap-4'>
      <div className='text-center'>试用版本不支持 "{name}" 功能</div>
      <Button onClick={() => {
        router.push("/login");
      }}>返回登录页面</Button>
    </div>
  );
}
