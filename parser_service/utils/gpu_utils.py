import os
from dataclasses import dataclass
from typing import Optional, Tuple
import pynvml


@dataclass
class GPUInfo:
    """Information about a single GPU device."""

    device_id: int
    name: str
    memory_total: int  # in bytes
    memory_used: int  # in bytes
    memory_free: int  # in bytes

    @property
    def memory_utilization(self) -> float:
        """Returns memory utilization as a percentage."""
        return (self.memory_used / self.memory_total) * 100

    def __str__(self) -> str:
        """Returns a human-readable string representation."""
        return (
            f"GPU {self.device_id} ({self.name}): "
            f"{self.memory_utilization:.1f}% used "
            f"({self.memory_used / 1024**2:.1f}MB / {self.memory_total / 1024**2:.1f}MB)"
        )


class GPUInfos:
    """Container class for information about all available GPUs."""

    def __init__(self):
        try:
            pynvml.nvmlInit()
        except pynvml.NVMLError:
            print("Failed to initialize NVML. GPU information may not be accurate.")
        self.refresh()

    def __del__(self):
        try:
            pynvml.nvmlShutdown()
        except:
            pass

    def refresh(self) -> None:
        """Refresh GPU information."""
        self.n_gpus = pynvml.nvmlDeviceGetCount()
        self.gpu_infos = []

        for i in range(self.n_gpus):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
            info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            name = pynvml.nvmlDeviceGetName(handle).decode("utf-8")

            self.gpu_infos.append(
                GPUInfo(
                    device_id=i,
                    name=name,
                    memory_total=info.total,
                    memory_used=info.used,
                    memory_free=info.free,
                )
            )

    def get_least_utilized_gpu(self) -> Optional[int]:
        """Returns the ID of the GPU with the lowest memory utilization."""
        if not self.gpu_infos:
            return None
        
        self.refresh()

        return min(
            range(self.n_gpus), key=lambda i: self.gpu_infos[i].memory_utilization
        )

    def get_least_utilized_gpu_and_memory(self) -> Optional[Tuple[int, float]]:
        """Returns the ID and the free memory in GB of the GPU with the lowest memory utilization."""
        gpu_id = self.get_least_utilized_gpu()
        if gpu_id is None:
            return None
        return (gpu_id, self.gpu_infos[gpu_id].memory_free / 1024**3)

    def __str__(self) -> str:
        """Returns a human-readable string representation of all GPUs."""
        if not self.gpu_infos:
            return "No GPUs available"
        return "\n".join(str(gpu) for gpu in self.gpu_infos)


if __name__ == "__main__":
    gpu_infos = GPUInfos()
    print(gpu_infos.get_least_utilized_gpu_and_memory())
