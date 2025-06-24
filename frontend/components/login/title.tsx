import { cn } from "@/lib/utils";

type Props = {
  classname?: string;
};

export const TitleEffect = ({ classname }: Props) => (
  <div
    className={cn(
      "text-[3em] text-white font-alibaba min-w-[6em] text-center font-alibaba-heavy ",
      classname
    )}
  >
    <p>玄材科技</p>
    <div className='inline-flex'>
      <p className='special-font'>
        <b>A&nbsp;I</b>
      </p>
      <p>知识图谱引擎</p>
    </div>
  </div>
);
