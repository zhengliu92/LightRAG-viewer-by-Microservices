import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUploadFileByChunks } from "@/hooks/use-file"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { X, XCircle, StopCircle, FolderUp } from "lucide-react"

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  cancelUpload?: () => void;
}
type FolderFile = {
  name: string;
}



type UploadFilesProps = {
  currentFolder: string;
  title?: string ;
  folder_files?: FolderFile[];
  onSuccess?: () => void;
  onStart?:  () => Promise<void>;
  onEachFileUploaded?: (file_name: string,file_size: number) => Promise<void>;
}

export function UploadFiles({ currentFolder, folder_files, onSuccess, onStart,onEachFileUploaded, title = "上传文件" }: UploadFilesProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileUploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  let maxUpload = Infinity

  if (process.env.NEXT_PUBLIC_RELEASE_MODE !== "true") {
    maxUpload = 50
  }

  const addFiles = (files: FileList ) => {
    if (folder_files && maxUpload){
      if (folder_files?.length + files.length > maxUpload) {
        toast.error(`测试版本，文件数量不能超过限制 ${maxUpload}`)
        setOpen(false)
        return
      }
    }
    
    const files_array = Array.from(files)
    const is_exist = files_array.some(file => {
      if(folder_files?.some(f => f.name === file.name)) {
        toast.error(`文件 ${file.name} 已存在, 请先删除`)
        return true
      }
    })
    if(is_exist) return;

    // filter big files
    const big_files = files_array.filter(file => file.size >= 25 * 1024 * 1024)
    if (big_files.length > 0) {
      for (const file of big_files) {
        toast.error(`文件 ${file.name} 大于25MB，已自动忽略`)
      }
    }
 
    const newFiles = files_array
      .filter(file => !selectedFiles.some(f => f.file.name === file.name))
      .filter(file => !big_files.some(f => f.name === file.name))
      .map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    e.stopPropagation();
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      await onStart?.();
    } catch (error) {
      console.log(error);
    }

    setIsUploading(true);
    const uploadPromises = selectedFiles
      .filter(f => f.status === 'pending')
      .map(async (fileProgress) => {
        try {
          let cancelUpload: (() => void) | undefined;

          setSelectedFiles(prev => prev.map(f => 
            f.file === fileProgress.file 
              ? { ...f, status: 'uploading' } 
              : f
          ));

          await useUploadFileByChunks(
            fileProgress.file, 
            currentFolder,
            (progress) => {
              setSelectedFiles(prev => prev.map(f => 
                f.file === fileProgress.file 
                  ? { ...f, progress } 
                  : f
              ));
            },
            (cancel) => {
              cancelUpload = cancel;
              setSelectedFiles(prev => prev.map(f => 
                f.file === fileProgress.file 
                  ? { ...f, cancelUpload: cancel } 
                  : f
              ));
            },
            async (file_name,file_size) => {
              await onEachFileUploaded?.(file_name,file_size)
            }
          );

          setSelectedFiles(prev => prev.map(f => 
            f.file === fileProgress.file 
              ? { ...f, status: 'completed', cancelUpload: undefined } 
              : f
          ));
        } catch (error) {
          if (error instanceof Error && error.message.includes('cancelled')) {
            setSelectedFiles(prev => prev.map(f => 
              f.file === fileProgress.file 
                ? { ...f, status: 'pending', progress: 0, cancelUpload: undefined } 
                : f
            ));
          } else {
            setSelectedFiles(prev => prev.map(f => 
              f.file === fileProgress.file 
                ? { ...f, status: 'error', cancelUpload: undefined } 
                : f
            ));
            throw error;
          }
        }
      });

    try {
      await Promise.all(uploadPromises);
      toast.success("所有文件上传成功");
      onSuccess?.();
    } catch (error) {
      toast.error("部分文件上传失败");
    } finally {
      setIsUploading(false);
    }
  }

  const removeFile = (file: File) => {
    setSelectedFiles(prev => {
      const fileProgress = prev.find(f => f.file === file);
      if (fileProgress?.status === 'uploading') {
        fileProgress.cancelUpload?.();
      }
      return prev.filter(f => f.file !== file);
    });
  }

  const handleCancel = (file: File) => {
    const fileProgress = selectedFiles.find(f => f.file === file);
    if (fileProgress?.status === 'uploading' && fileProgress.cancelUpload) {
      fileProgress.cancelUpload();
    }
  }

  const getStatusColor = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'uploading': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild >
        <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <FolderUp className="h-4 w-4" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>上传文件</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          支持多文件上传, 支持拖拽上传, 支持批量上传
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-colors",
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25",
              "cursor-pointer"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
              <p>拖拽文件到此处或点击上传</p>
              <p className="text-xs">支持多文件上传</p>
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {selectedFiles.map(({ file, progress, status }) => (
              <div key={file.name} className="grid gap-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <div className="flex items-center gap-2">
                    {status === 'uploading' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(file)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          title="取消上传"
                        >
                          <StopCircle className="h-4 w-4 text-red-500" />
                        </Button>
                        <div className="text-xs text-muted-foreground text-right">
                            {Math.round(progress * 100)}%
                        </div>
                      </>
                    )}
                    {status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    {status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getStatusColor(status)}`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>

              </div>
            ))}
          </div>
        </div>
        <DialogFooter >
          <Button variant="outline"  className="" onClick={() => setSelectedFiles([])}>清空</Button>  
          <Button variant="outline" onClick={() => setOpen(false)}>关闭</Button>
          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || !selectedFiles.some(f => f.status === 'pending')}
          >
            {isUploading ? "上传中..." : "开始上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
