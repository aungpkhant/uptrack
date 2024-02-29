#!/bin/bash

# Usage: ./insert_item.sh <user_id> 

if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <user_id> <account_id> <spreadsheet_id> <up_token>"
    exit 1
fi

user_id=$1
account_id=$2
spreadsheet_id=$3
up_token=$4

aws dynamodb put-item \
    --table-name uptrack \
    --item \
        '{"pk": {"S": "user#'$user_id'"}, "sk": {"S": "user#'$user_id'"}, "account_id": {"S": "'$account_id'"}, "spreadsheet_id": {"S": "'$spreadsheet_id'"}, "up_token": {"S": "'$up_token'"}}'