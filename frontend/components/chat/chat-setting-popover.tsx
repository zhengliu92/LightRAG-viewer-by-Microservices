import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CircleHelp, SettingsIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import React from "react";
import useChatConfig from "@/hooks/use-chat-config";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectItem } from "../ui/select";

type SliderProps = {
  value: number[];
  onValueChange: (v: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
};
function SettingSlider(props: SliderProps) {
  return (
    <div className={cn("flex items-center space-x-3", props.className)}>
      <Slider
        max={props.max}
        min={props.min}
        value={props.value}
        onValueChange={(v) => props.onValueChange(v)}
        step={props.step}
      />
      <Label className=''>{props.value[0]}</Label>
    </div>
  );
}

type ChatSettingHelperProps = {
  content: string;
};

function ChatSettingHelper({ content }: ChatSettingHelperProps) {
  return (
    <Popover>
      <PopoverTrigger>
        <CircleHelp className='h-4 w-4 hover:text-primary/60 ' />
      </PopoverTrigger>
      <PopoverContent className='text-sm'>{content}</PopoverContent>
    </Popover>
  );
}

type QueryMode = 'global' | 'local' | 'hybrid';

export default function ChatSettingPopover() {
  const {
    topN,
    setTopN,
    maxMemory,
    setMaxMemory,
    temperature,
    setTemperature,
    threshold,
    setThreshold,
    queryMode,
    setQueryMode,
  } = useChatConfig();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type='button'>
          <SettingsIcon className='flex items-center justify-center w-6 h-6  hover:text-primary/60' />
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-full'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='font-medium leading-none text-xl'>对话设置</h4>
          </div>
          <div className='grid gap-2'>
          <div className='grid grid-cols-3 items-center gap-4'>
              <div className=' flex items-end'>
                <Label>询问模式</Label>
                <ChatSettingHelper content='全局搜索会从更宽的视野搜索资料，精细搜索会从更精细的角度搜索资料，混合搜索会兼顾两者。' />
              </div>
              <Select
                value={queryMode}
                onValueChange={(v: QueryMode) => setQueryMode(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-full'>
                  <SelectItem value="global" className="cursor-pointer">全局搜索</SelectItem>
                  <SelectItem value="local" className="cursor-pointer">精细搜索</SelectItem>
                  <SelectItem value="hybrid" className="cursor-pointer">混合搜索</SelectItem>
                </SelectContent>
              </Select>
            </div>



            <div className='grid grid-cols-3 items-center gap-4'>
              <div className=' flex items-end'>
                <Label>最大引用数量</Label>
                <ChatSettingHelper content='高的数值会让对话系统引用更多的资料，但引用过多可能会影响输出质量' />
              </div>
              <SettingSlider
                className='col-span-2 h-6'
                value={topN}
                min={1}
                onValueChange={(v) => setTopN(v)}
                max={15}
                step={1}
              />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <div className=' flex items-end'>
                <Label>记忆对话长度</Label>
                <ChatSettingHelper content='高的数值会让对话系统记忆更多的对话, 但记忆过多可能会影响输出质量' />
              </div>
              <SettingSlider
                className='col-span-2 h-6'
                value={maxMemory}
                min={5}
                onValueChange={(v) => setMaxMemory(v)}
                max={15}
                step={1}
              />
            </div>

            <div className='grid grid-cols-3 items-center gap-4'>
              <div className=' flex items-end'>
                <Label>模型温度</Label>
                <ChatSettingHelper content='温度越高，模型输出越随机，但输出质量可能下降' />
              </div>
              <SettingSlider
                className='col-span-2 h-6'
                value={temperature}
                min={0.0}
                onValueChange={(v) => setTemperature(v)}
                max={0.5}
                step={0.05}
              />
            </div>
          </div>
          <div className='grid grid-cols-3 items-center gap-4'>
            <div className=' flex items-end'>
              <Label>相似度阈值</Label>
              <ChatSettingHelper content='高的数值会减少引用结果的数量，但提升引用结果的质量' />
            </div>
            <SettingSlider
              className='col-span-2 h-6'
              value={threshold}
              min={0.1}
              onValueChange={(v) => setThreshold(v)}
              max={0.9}
              step={0.05}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
