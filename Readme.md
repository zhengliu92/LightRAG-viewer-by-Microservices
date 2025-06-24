# LightRAG viewer by Microservices

This project implements a lightweight Retrieval-Augmented Generation (RAG) system using a microservices architecture. It includes embedding, file storage, main RAG, document parsing, API gateway, and frontend services. Suitable for knowledge base, intelligent Q&A, and similar scenarios.

[中文介绍](./ReadMe-zh.md)


[Click here to watch the demo video](demo-video.mp4)

---

## Project Structure

- `embed_service/`: Text embedding and reranking service (Python, FastAPI, gRPC)
- `file-service/`: File storage and management service (Go, gRPC, MinIO)
- `lightrag_service/`: Main RAG service for knowledge base building and QA (Python, FastAPI)
- `parser_service/`: Document parsing and processing service (Python, gRPC)
- `gateway_service/`: API gateway for unified authentication, routing, user management (Go, gRPC/HTTP)
- `frontend/`: Web frontend (Next.js, React, TypeScript)

---

## Service Overview & How to Run

### 1. Embedding Service

- **Function:** Provides text embedding and reranking APIs.
- **Dependencies:** `grpcio`, `fastapi`, `FlagEmbedding`, `uvicorn`, etc.
- **Run locally:**
  ```bash
  cd embed_service
  pip install -r requirements.txt
  python main.py
  ```
- **Docker:**
  ```bash
  docker build -t embed_service .
  docker run -p 8888:8888 embed_service
  ```
- **Main APIs:**
  - `POST /embed`: Batch text embedding
  - `POST /rerank`: Text reranking

---

### 2. File-Service

- **Function:** MinIO-based file storage, supports gRPC/HTTP upload, download, and management.
- **Dependencies:** Go 1.23+, `minio-go`, `grpc`, `logrus`, etc.
- **Run locally:**
  ```bash
  cd file-service
  go build -o main main.go
  ./main
  ```
- **Docker:**
  ```bash
  docker build -t file-service .
  docker run -p 9001:9001 -p 9000:9000 file-service
  ```
- **Tip:** Use `docker-compose-with-fserver.yaml` for one-click MinIO + file service deployment.

---

### 3. LightRAG Service

- **Function:** Main RAG service, supports knowledge base building, document ingestion, streaming QA, and graph queries.
- **Dependencies:** `fastapi`, `grpcio`, `redis`, `openai`, `networkx`, etc.
- **Run locally:**
  ```bash
  cd lightrag_service
  pip install -r requirements.txt
  python main.py
  ```
- **Docker:**
  ```bash
  docker build -t lightrag_service .
  docker run -p 8000:8000 lightrag_service
  ```
- **Main APIs:**
  - `/documents/insert`: Document ingestion
  - `/query/stream`: Streaming QA
  - `/kb/graph`: Knowledge graph query

---

### 4. Parser Service

- **Function:** Document parsing, OCR, and structured processing via gRPC.
- **Dependencies:** `grpcio`, `streamlit`, `marker-pdf`, `redis`, etc.
- **Run locally:**
  ```bash
  cd parser_service
  pip install -r requirements.txt
  python main.py
  ```
- **Docker:**
  ```bash
  docker build -t parser_service .
  docker run -p 50052:50052 parser_service
  ```

---

### 5. Gateway Service

- **Function:** API gateway for unified authentication, routing, and event processing, connecting all backend services.
- **Dependencies:** Go 1.23+, `grpc-gateway`, `pgx`, `redis`, `logrus`, etc.
- **Run locally:**
  ```bash
  cd gateway_service
  go build -o main main.go
  ./main
  ```
- **Docker:**
  ```bash
  docker build -t gateway_service .
  docker run -p 8080:8080 gateway_service
  ```

---

### 6. Frontend

- **Tech stack:** Next.js, React, TypeScript, TailwindCSS
- **Run locally:**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Default: [http://localhost:3200](http://localhost:3200)
- **Docker:**
  ```bash
  docker build -t frontend .
  docker run -p 3200:3200 frontend
  ```

---

## Environment Variables

- Each service supports configuration via `.env` or environment variables (ports, DB, MinIO, Redis, OpenAI Key, etc).
- See each service's `dockerfile`, or code for details.

---

## Requirements

- Python services: Python 3.11+ (virtual environment recommended)
- Go services: Go 1.23+
- Frontend: Node.js 18+
- Docker is recommended for unified deployment

---

## Credits

1. [LightRAG](https://github.com/HKUDS/LightRAG)
2. [BAAI bge-m3](https://huggingface.co/BAAI/bge-m3)
3. [Marker](https://github.com/datalab-to/marker)


## License
MIT
---

