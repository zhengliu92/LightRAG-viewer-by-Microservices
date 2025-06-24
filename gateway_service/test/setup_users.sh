grpcurl -protoset pb/myservice.protoset -plaintext -d '{"role_name":"user"}' localhost:50053 pb.GatewayService/CreateRole | jq

grpcurl -protoset pb/myservice.protoset -plaintext -d '{"role_name":"admin"}' localhost:50053 pb.GatewayService/CreateRole | jq

# # Get all roles
grpcurl -protoset pb/myservice.protoset -plaintext localhost:50053 pb.GatewayService/GetAllRoles | jq

# # Create a user
grpcurl -protoset pb/myservice.protoset -plaintext -d '{"email": "332644263@qq.com", "password": "password", "username": "username", "role_name":"admin"}' localhost:50053 pb.GatewayService/CreateUser | jq
