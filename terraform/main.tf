provider "aws" {
  region = var.region
}

resource "aws_lambda_function" "uptrack" {
  function_name = "uptrack"
  role          = aws_iam_role.uptrack_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
}

resource "aws_iam_role" "uptrack_lambda" {
  name = "uptrack_lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
  tags = {
    Name = "uptrack"
  }
}

resource "aws_iam_policy_attachment" "uptrack" {
  name       = "lambda_execution_policy_attachment"
  roles      = [aws_iam_role.uptrack_lambda.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" # Attach basic Lambda execution policy
}

output "uptrack_lambda_arn" {
  value = aws_iam_role.uptrack_lambda.arn
}

resource "aws_dynamodb_table" "uptrack_transactions" {
  name         = "uptrack_transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "owner_id"
  range_key    = "transaction_id"

  attribute {
    name = "owner_id"
    type = "S"
  }

  attribute {
    name = "transaction_id"
    type = "S"
  }

  tags = {
    Name = "uptrack"
  }
}

resource "aws_iam_policy" "lambda_dynamodb_full_access" {
  name        = "lambda_dynamodb_full_access"
  description = "Provides full access to the DynamoDB table"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = "dynamodb:*",
      Resource = aws_dynamodb_table.uptrack_transactions.arn
    }]
  })
}

resource "aws_iam_policy_attachment" "lambda_dynamodb" {
  name       = "lambda_dynamodb_policy_attachment"
  roles      = [aws_iam_role.uptrack_lambda.name]
  policy_arn = aws_iam_policy.lambda_dynamodb_full_access.arn
}

resource "aws_ssm_parameter" "gsheet-service-account-json" {
  name        = "/production/google-cloud-credentials/service-account-json"
  description = "Service account credentials for Google Cloud to access Google Sheets"
  type        = "SecureString"
  value       = var.gsheet_service_account_json
}

resource "aws_iam_policy" "lambda_ssm_parameter_access" {
  name        = "lambda_ssm_parameter_access"
  description = "Provides access to the SSM parameter for the Google Sheets service account JSON file"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = "ssm:GetParameter",
      Resource = aws_ssm_parameter.gsheet-service-account-json.arn
    }]
  })
}

resource "aws_iam_policy_attachment" "parameter_access" {
  name       = "uptrack_lambda_access_parameter"
  roles      = [aws_iam_role.uptrack_lambda.name]
  policy_arn = aws_iam_policy.lambda_ssm_parameter_access.arn
}

resource "aws_cloudwatch_event_bus" "uptrack" {
  name = "uptrack"
}

output "event_bus_arn" {
  value = aws_cloudwatch_event_bus.uptrack.arn
}

resource "aws_cloudwatch_event_rule" "sync_transactions" {
  name        = "sync_transactions"
  description = "Trigger the Lambda function to sync transactions from Google Sheets to DynamoDB"
  schedule_expression = "rate(15 minutes)"
}

resource "aws_cloudwatch_event_target" "uptrack_lambda" {
  rule = aws_cloudwatch_event_rule.sync_transactions.name
  arn = aws_lambda_function.uptrack.arn
}

output "event_rule_arn" {
  value = aws_cloudwatch_event_rule.sync_transactions.arn
}