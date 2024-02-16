deploy:
	npm run build
	aws lambda update-function-code --function-name uptrack --zip-file "fileb://dist/index.zip"