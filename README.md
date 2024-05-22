# AWS Lambda Centralized Logging and Insights Enabler
 
 ## Overview

This repository contains an AWS Lambda function designed to enable centralized logging and AWS Lambda Insights on all existing Lambda functions in an AWS account. It performs the following tasks:

- Creates a centralized log group if it does not already exist.
- Updates each Lambda function's configuration to use this centralized log group.
- Enables AWS Lambda Insights on each Lambda function by adding the appropriate Lambda Insights layer.
  Prerequisites