provider "aws" {
  region = var.region
}

data "archive_file" "uptrack" {
  type        = "zip"
  source_file = "${path.module}/../dist/index.js"
  output_path = "${path.module}/../dist/uptrack.zip"
}

resource "aws_lambda_function" "uptrack" {
  function_name = "uptrack"
  role          = aws_iam_role.uptrack_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 90
  memory_size   = 256

  filename         = "${path.module}/../dist/uptrack.zip"
  source_code_hash = data.archive_file.uptrack.output_base64sha256

  environment {
    variables = var.uptrack_lambda_env_vars
  }
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

resource "aws_dynamodb_table" "uptrack" {
  name         = "uptrack"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  tags = {
    Name = "uptrack"
  }
}

resource "aws_dynamodb_table" "uptrack_users" {
  name         = "uptrack_users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Name = "uptrack"
  }
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

resource "aws_dynamodb_table" "uptrack_gsheet_formats" {
  name         = "uptrack_gsheet_formats"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "year_month"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "year_month"
    type = "N"
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
      Resource = [aws_dynamodb_table.uptrack_users.arn, aws_dynamodb_table.uptrack_transactions.arn, aws_dynamodb_table.uptrack_gsheet_formats.arn, aws_dynamodb_table.uptrack.arn]
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
  name                = "sync_transactions"
  description         = "Trigger the Lambda function to sync transactions from Google Sheets to DynamoDB"
  schedule_expression = "cron(0/15 * * * ? *)"
}

resource "aws_cloudwatch_event_target" "uptrack_lambda" {
  for_each = { for i, v in var.uptrack_users : i => v }

  rule = aws_cloudwatch_event_rule.sync_transactions.name
  arn  = aws_lambda_function.uptrack.arn

  input = jsonencode({
    action = "sync"
    details = {
      user : each.value.user_id,
      sync_days_ago : each.value.sync_days_ago
    }
  })
}

output "event_rule_arn" {
  value = aws_cloudwatch_event_rule.sync_transactions.arn
}

resource "aws_lambda_permission" "eventbridge_permission" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.uptrack.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sync_transactions.arn
}

resource "aws_iam_policy" "cloudwatch_put_metrics_policy" {
  name        = "CloudWatchPutMetricsPolicy"
  description = "Policy for writing custom metrics to CloudWatch"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "cloudwatch:PutMetricData",
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "cloudwatch_put_metrics_policy_attachment" {
  name       = "CloudWatchPutMetricsPolicyAttachment"
  roles      = [aws_iam_role.uptrack_lambda.name]
  policy_arn = aws_iam_policy.cloudwatch_put_metrics_policy.arn
}
