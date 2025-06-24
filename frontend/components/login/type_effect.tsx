import { cn } from "@/lib/utils";
import { ReactTyped } from "react-typed";

type Props = {
  classname?: string;
};

export const TypeEffect = ({ classname }: Props) => (
  <div
    className={cn(
      " text-[3em] font-bold text-white font-zentry  bg-gray-500/20 min-w-[6em] text-center rounded-2xl backdrop-blur-[5px] ",
      classname
    )}
  >
    <p>玄材科技</p>
    <div className='inline-flex'>
      <p className='special-font'>
        <b>A</b> I
      </p>
      <ReactTyped
        strings={["知识图谱引擎"]}
        typeSpeed={200}
        backSpeed={100}
        loop
      />
    </div>
  </div>
);
