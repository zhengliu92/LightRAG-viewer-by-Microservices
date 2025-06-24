protos:
	python -m grpc_tools.protoc -I=. --python_out=. --pyi_out=. --grpc_python_out=. ./protos/embedService.proto

remove_none:
	@if [ -n "$$(docker images -f "dangling=true" -q)" ]; then \
		docker rmi $$(docker images -f "dangling=true" -q); \
	else \
		echo "No dangling images to remove."; \
	fi


.PHONY: protos