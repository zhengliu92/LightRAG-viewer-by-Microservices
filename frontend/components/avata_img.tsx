import { getAvatar } from "@/utils/avatas";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";



type AvatarImgProps = {
    avatar: string;
    role: string;
    username: string;
  };


  
export const AvatarImg: React.FC<AvatarImgProps> = ({ avatar, role, username }) => {
    let avatar_src = "";
    let fallback_name = "";

    if (role === "user") {
      avatar_src = getAvatar(avatar);
      fallback_name = username;
    }else{
      avatar_src = '/ai-bot.png';
      fallback_name = "AI";
    }

    return (
      <Avatar className='h-8 w-8 rounded-lg cursor-pointer'>
        <AvatarImage src={avatar_src} alt={"user"} width={300} height={300}/>
        <AvatarFallback className='rounded-lg'>
            {fallback_name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
    );
  };
  