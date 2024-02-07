provider "aws" {
  region = var.region
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

