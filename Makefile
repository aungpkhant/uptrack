create:
	aws lambda update-function-code --function-name uptrack --runtime "nodejs20.x" --role arn:aws:iam::992382771770:role/uptrack_lambda --zip-file "fileb://dist/index.zip" --handler index.handler
deploy:
	npm run build
	aws lambda update-function-code --function-name uptrack --zip-file "fileb://dist/index.zip"