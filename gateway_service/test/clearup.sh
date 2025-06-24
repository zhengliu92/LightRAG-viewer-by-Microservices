# Login user and get token
response=$(grpcurl -protoset pb/myservice.protoset -plaintext -d '{"password": "password", "username": "username"}' localhost:50051 pb.GatewayService/LoginUser)
if [ $? -ne 0 ]; then
    echo "Error: Failed to login user" >&2
    exit 1
fi
echo "$response" | jq
token=$(echo "$response" | jq -r '.accessToken')
if [ -z "$token" ]; then
    echo "Error: Token is empty" >&2
    exit 1
fi
echo "{Token: $token}" 

# Delete roles
grpcurl -protoset pb/myservice.protoset -H "Authorization: Bearer $token" -plaintext -d '{"role_name":"user"}' localhost:50051 pb.GatewayService/DeleteRole | jq
grpcurl -protoset pb/myservice.protoset -H "Authorization: Bearer $token" -plaintext -d '{"role_name":"admin"}' localhost:50051 pb.GatewayService/DeleteRole | jq
