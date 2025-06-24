# LightRAG viewer by Microservices

本项目基于微服务架构实现了轻量级 RAG（Retrieval-Augmented Generation）系统，包含嵌入服务、文件服务、主 RAG 服务、解析服务、API 网关和前端。适用于知识库、智能问答等场景。

[English](./Readme.md)

---

## 目录结构

- `embed_service/`：文本嵌入与重排序服务（Python, FastAPI, gRPC）
- `file-service/`：文件存储与管理服务（Go, gRPC, MinIO）
- `lightrag_service/`：主 RAG 服务，知识库构建与问答（Python, FastAPI）
- `parser_service/`：文档解析与处理服务（Python, gRPC）
- `gateway_service/`：API 网关与统一鉴权,用户管理（Go, gRPC/HTTP）
- `frontend/`：前端界面（Next.js, React, TypeScript）

---

## 各服务简介与启动

### 1. Embedding Service

- 功能：提供文本向量化（embedding）和重排序（rerank）API。
- 依赖：`grpcio`, `fastapi`, `FlagEmbedding`, `uvicorn` 等。
- 启动方式：
  ```bash
  cd embed_service
  pip install -r requirements.txt
  python main.py
  ```
- Docker 启动：
  ```bash
  docker build -t embed_service .
  docker run -p 8888:8888 embed_service
  ```
- 主要接口：
  - `POST /embed`：批量文本向量化
  - `POST /rerank`：文本重排序

---

### 2. File-Service

- 功能：基于 MinIO 的文件存储服务，支持 gRPC/HTTP 文件上传、下载、管理。
- 依赖：Go 1.23+，`minio-go`, `grpc`, `logrus` 等。
- 启动方式：
  ```bash
  cd file-service
  go build -o main main.go
  ./main
  ```
- Docker 启动：
  ```bash
  docker build -t file-service .
  docker run -p 9001:9001 -p 9000:9000 file-service
  ```
- 推荐使用 `docker-compose-with-fserver.yaml` 一键启动 MinIO + 文件服务。

---

### 3. LightRAG Service

- 功能：主 RAG 服务，支持知识库构建、文档入库、流式问答、图谱查询等。
- 依赖：`fastapi`, `grpcio`, `redis`, `openai`, `networkx` 等。
- 启动方式：
  ```bash
  cd lightrag_service
  pip install -r requirements.txt
  python main.py
  ```
- Docker 启动：
  ```bash
  docker build -t lightrag_service .
  docker run -p 8000:8000 lightrag_service
  ```
- 主要接口：
  - `/documents/insert` 文档入库
  - `/query/stream` 流式问答
  - `/kb/graph` 知识图谱查询

---

### 4. Parser Service

- 功能：文档解析、OCR、结构化处理，gRPC 服务。
- 依赖：`grpcio`, `streamlit`, `marker-pdf`, `redis` 等。
- 启动方式：
  ```bash
  cd parser_service
  pip install -r requirements.txt
  python main.py
  ```
- Docker 启动：
  ```bash
  docker build -t parser_service .
  docker run -p 50052:50052 parser_service
  ```

---

### 5. Gateway Service

- 功能：API 网关，统一鉴权、路由、事件处理，连接各后端服务。
- 依赖：Go 1.23+，`grpc-gateway`, `pgx`, `redis`, `logrus` 等。
- 启动方式：
  ```bash
  cd gateway_service
  go build -o main main.go
  ./main
  ```
- Docker 启动：
  ```bash
  docker build -t gateway_service .
  docker run -p 8080:8080 gateway_service
  ```

---

### 6. 前端（frontend）

- 技术栈：Next.js, React, TypeScript, TailwindCSS
- 启动方式：
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  默认端口：`http://localhost:3200`
- Docker 启动：
  ```bash
  docker build -t frontend .
  docker run -p 3200:3200 frontend
  ```

---

## 环境变量说明

- 各服务支持通过 `.env` 或环境变量配置端口、数据库、MinIO、Redis、OpenAI Key 等参数。
- 参考各服务目录下的 `dockerfile` 或代码中的 `ENV` 配置。


---

## 依赖与安装

- Python 服务需 Python 3.11+，建议使用虚拟环境。
- Go 服务需 Go 1.23+。
- 前端需 Node.js 18+。
- 推荐使用 Docker 统一部署。

---

## 参考与致谢

1. [LightRAG](https://github.com/HKUDS/LightRAG)
2. [BAAI bge-m3](https://huggingface.co/BAAI/bge-m3)
3. [Marker](https://github.com/datalab-to/marker)


## License
MIT
---

欢迎联系作者。

