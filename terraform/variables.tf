variable "region" {
  description = "The aws region where resources will be created"
  type        = string
  default     = "ap-southeast-2"
}

variable "gsheet_service_account_json" {
  description = "Stringified JSON of the service account for Google Sheets"
  type        = string
}
variable "uptrack_users" {
  description = "List of usernames who will be using the Uptrack application"
  type = list(object({
    user_id : string
    sync_days_ago : number
  }))
}

variable "uptrack_lambda_env_vars" {
  description = "Environment variables for the lambda function"
  type        = map(string)
}

