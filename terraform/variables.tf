variable "region" {
  description = "The aws region where resources will be created"
  type        = string
  default     = "ap-southeast-2"
}

variable "gsheet_service_account_json" {
  description = "Stringified JSON of the service account for Google Sheets"
  type        = string
}

variable "uptrack_lambda_env_vars" {
  description = "Environment variables for the lambda function"
  type        = map(string)
}
