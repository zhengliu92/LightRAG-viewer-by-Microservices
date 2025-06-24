DB_URL=postgresql://postgres:secretpass@localhost:5432/papergraph?sslmode=disable
PB_PATH=pb

init_migrate:
	migrate create -ext sql -dir db/schema -seq init_schema

protos-go:
	mkdir -p $(PB_PATH)
	rm -f $(PB_PATH)/*.go
	protoc --proto_path=proto \
	--descriptor_set_out=$(PB_PATH)/myservice.protoset \
	--include_imports \
	--go_out=$(PB_PATH) --go_opt=paths=source_relative \
	--go-grpc_out=$(PB_PATH) --go-grpc_opt=paths=source_relative \
	--grpc-gateway_out=$(PB_PATH) --grpc-gateway_opt=paths=source_relative \
	proto/*.proto

protos-go-parser:
	mkdir -p parser_service
	rm -f parser_service/*.go
	protoc --proto_path=parser_service \
	--descriptor_set_out=parser_service/myservice.protoset \
	--include_imports \
	--go_out=parser_service --go_opt=paths=source_relative \
	--go-grpc_out=parser_service --go-grpc_opt=paths=source_relative \
	--grpc-gateway_out=parser_service --grpc-gateway_opt=paths=source_relative \
	parser_service/*.proto

up:
	docker compose up -d

down:
	docker compose down

migrateup:
	migrate -path db/schema -database "$(DB_URL)" force 1
	migrate -path db/schema -database "$(DB_URL)" -verbose down
	migrate -path db/schema -database "$(DB_URL)" -verbose up

migratedown:
	migrate -path db/schema -database "$(DB_URL)" -verbose down

conf:
	sqlc
	proto-gateway
	
sqlc:
	sqlc generate



.PHONY: protos up migrateup migratedown sqlc init_migrate conf

