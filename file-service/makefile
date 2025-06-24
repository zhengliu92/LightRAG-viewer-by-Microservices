PB_PATH=file_service


protos-go:
	mkdir -p $(PB_PATH)
	rm -f $(PB_PATH)/*.go
	protoc --proto_path=proto \
	--descriptor_set_out=$(PB_PATH)/file-service.protoset \
	--include_imports \
	--go_out=$(PB_PATH) --go_opt=paths=source_relative \
	--go-grpc_out=$(PB_PATH) --go-grpc_opt=paths=source_relative \
	--grpc-gateway_out=$(PB_PATH) --grpc-gateway_opt=paths=source_relative \
	proto/*.proto
	mkdir -p ../gateway_service/file_service
	cp -r $(PB_PATH)/*.go ../gateway_service/file_service
	cp proto/file-messages.proto ../gateway_service/proto/rpc_file.pending.proto

protos-py:
	python -m grpc_tools.protoc -I=. \
		--python_out=.\
		--pyi_out=.\
		--grpc_python_out=.\
		proto/file-service-py.proto

	cp proto/*.py* ../parser_service/client/file_grpc


up:
	docker compose up -d


up-all:
	docker compose -f docker-compose-with-fserver.yaml up -d

down:
	docker compose down



.PHONY: protos 