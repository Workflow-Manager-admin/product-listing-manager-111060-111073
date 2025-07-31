#!/bin/bash
cd /home/kavia/workspace/code-generation/product-listing-manager-111060-111073/product_frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

