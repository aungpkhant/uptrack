## Uptrack

A cloud-native tool that periodically syncs your [Up Bank](https://developer.up.com.au/) transactions to Google Sheets.

Built on top of [AWS Lambda](https://docs.aws.amazon.com/lambda/), [DynamoDB](https://aws.amazon.com/dynamodb) and [EventBridge](https://aws.amazon.com/eventbridge/) to schedule cronjobs using Typescript and Terraform as IaC tool of choice.

### Why I built this tool?

As much as I loved tracking my expenses, manually inputting them to a spreadsheet was killing a piece of my soul one keystroke at a time. The habit never stuck because of how monotonous it was.. until one day I discovered the Up Bank API and a lightbulb popped in my head.

Also to add a practical project to my portfolio.

### TODO

- [x] Sync expenses to spreadsheet
- [x] Customize sheet columns
- [ ] Monthly expense summary email
- [ ] Write set up docs
