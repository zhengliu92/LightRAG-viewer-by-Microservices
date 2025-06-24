#!/bin/bash

# Test the /embed endpoint with a simple example
curl -X POST http://localhost:8888/embed \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["This is a test sentence", "Another test sentence"],
    "max_length": 512,
    "batch_size": 2
  }'
