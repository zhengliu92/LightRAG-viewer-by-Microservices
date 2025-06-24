curl https://api.siliconflow.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-tqxhatztnkxxvkzhhlpdjawxvraopbhbevulsqaffidvigmf" \
  -d '{
        "model": "Pro/deepseek-ai/DeepSeek-V3",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": "Hello!"}
        ],
        "stream": false
      }'