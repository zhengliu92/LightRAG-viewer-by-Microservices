"use client"

import { useKbConfig } from '@/hooks/use-kb-config'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useKnowledgeBase } from '@/contexts/knowledge-base-context'

const formSchema = z
  .object({
    chunk_size: z.coerce.number().min(1200, "分块大小不能小于1200").max(5000, "分块大小不能大于5000"),
    chunk_overlap_size: z.coerce.number().min(100, "重叠大小不能小于100").max(500, "重叠大小不能大于500"),
    embed_model: z.string({
      required_error: "请选择嵌入模型",
    }),
  })
  .refine((data) => data.chunk_overlap_size < data.chunk_size, {
    message: "重叠大小必须小于分块大小",
    path: ["chunk_overlap_size"],
  });

const KnowlegeBaseConfig = () => {
  const pathname = usePathname()
  const path_splits = pathname.split('/')
  const kb_id = path_splits[path_splits.length - 1]
  const {ragConfig, ragConfigLoading, upsertRagConfigAsync} = useKbConfig(kb_id)  
  const {getKbById} = useKnowledgeBase()
  const [disableEdit, setDisableEdit] = useState(false)
  const kb = getKbById(kb_id)
  const hasValidKb = kb?.kb_file_build_finished_count && Number(kb.kb_file_build_finished_count) > 0


  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chunk_size: ragConfig?.chunk_token_size || 1200,
      chunk_overlap_size: ragConfig?.chunk_overlap_token_size || 100,
      embed_model: ragConfig?.embed_model || "text-embedding-3-small",
    },
  })

  // Watch form values to check for changes
  const formValues = form.watch();

  const hasChanges = ragConfig ? (
    formValues.chunk_size !== ragConfig.chunk_token_size ||
    formValues.chunk_overlap_size !== ragConfig.chunk_overlap_token_size ||
    formValues.embed_model !== ragConfig.embed_model
  ) : false;

  async function onSubmit(values: z.infer<typeof formSchema>) {
      if (!hasChanges) return;
      
      setIsSubmitting(true)
      await upsertRagConfigAsync({
        kb_id,
        chunk_token_size: values.chunk_size,
        chunk_overlap_token_size: values.chunk_overlap_size,
        embed_model: values.embed_model,
      })
      setIsSubmitting(false)
  }
  
  useEffect(() => {    
    form.reset({
      chunk_size: ragConfig?.chunk_token_size || 1200,
      chunk_overlap_size: ragConfig?.chunk_overlap_token_size || 100,
      embed_model: ragConfig?.embed_model || "text-embedding-3-small",
    })
  }, [ragConfig])

  useEffect(() => {
    if (hasValidKb) {
      setDisableEdit(true)
    }
  }, [hasValidKb])

  if (ragConfigLoading || !ragConfig) {
    return <div>Loading...</div>
  }


  return (
    <div className="w-full mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">知识库配置</h3>
          <p className="text-sm text-muted-foreground">
            配置知识库的分块大小和重叠大小，这些设置会影响知识库的检索效果。
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="chunk_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分块大小 (Token)</FormLabel>
                  <FormDescription>
                    每个文本块的大小，建议设置在1200-3600之间。
                  </FormDescription>
                  <FormControl>
                    <Input type="number" {...field} disabled={disableEdit}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chunk_overlap_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>重叠大小 (Token)</FormLabel>
                  <FormDescription>
                    相邻文本块之间的重叠大小，建议设置为分块大小的10%-20%。
                  </FormDescription>
                  <FormControl>
                    <Input type="number" {...field} disabled={disableEdit}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="embed_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>嵌入模型</FormLabel>
                  <FormDescription>
                    选择用于文本嵌入的模型，不同模型在效果和性能上有所差异。国内用户推荐使用BGE-M3。
                  </FormDescription>
                  <Select onValueChange={field.onChange} disabled={disableEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text-embedding-3-small" className="hover:cursor-pointer">text-embedding-3-small</SelectItem>
                      <SelectItem value="bge-m3" className="hover:cursor-pointer">bge-m3</SelectItem>
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || !hasChanges || disableEdit}>
              {isSubmitting ? "保存中..." : "保存配置"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default KnowlegeBaseConfig