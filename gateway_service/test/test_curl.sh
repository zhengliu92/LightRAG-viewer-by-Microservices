# grpcurl -protoset pb/myservice.protoset -plaintext -d '{"role_name":"user"}' localhost:50053 pb.GatewayService/CreateRole | jq


curl -X POST -H "Content-Type: application/json" -d '{"role_name":"user"}' localhost:8090/v1/role/create | jq

curl -X POST -H "Content-Type: application/json" -d '{"user_name":"user"}' localhost:8090/v1/user/create | jq


curl -X POST -H "Content-Type: application/json" -d '{"file_name":"a.txt","chunk_index":0,"chunk_data":"YQ=="}' 192.168.1.100:8090/v1/file/upload_chunk 



