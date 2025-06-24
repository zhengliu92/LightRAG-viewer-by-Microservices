PB_PATH=parser_service

pip-freeze:
	pipreqs .

protos-go:
	mkdir -p $(PB_PATH)
	rm -f $(PB_PATH)/*.go
	protoc --proto_path=protos \
	--descriptor_set_out=$(PB_PATH)/parser-service.protoset \
	--include_imports \
	--go_out=$(PB_PATH) --go_opt=paths=source_relative \
	--go-grpc_out=$(PB_PATH) --go-grpc_opt=paths=source_relative \
	--grpc-gateway_out=$(PB_PATH) --grpc-gateway_opt=paths=source_relative \
	protos/*.proto

up:
	docker compose up -d

down:
	docker compose down

protos-py:
	rm -rf protos/*.py*
	python -m grpc_tools.protoc -I=. \
		--python_out=.\
		--pyi_out=.\
		--grpc_python_out=.\
		protos/parser_service.proto



remove_none:
	@if [ -n "$$(docker images -f "dangling=true" -q)" ]; then \
		docker rmi $$(docker images -f "dangling=true" -q); \
	else \
		echo "No dangling images to remove."; \
	fi
	
.PHONY: up down