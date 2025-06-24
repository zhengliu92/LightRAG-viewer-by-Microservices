const makeAvatarList = () => {
  const avatarList: Record<string, string> = {
    default: "/avatars/default.jpg",
  };
  for (let i = 1; i <= 11; i++) {
    avatarList[`img${i}`] = `/avatars/img${i}.jpg`;
  }
  return avatarList;
};

export const getAvatar = (name: string) => {
  return avataList[name] || avataList.default;
};

export const avataList = makeAvatarList();
