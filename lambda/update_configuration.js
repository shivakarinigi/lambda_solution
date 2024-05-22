const {
	LambdaClient,
	ListFunctionsCommand,
	GetFunctionConfigurationCommand,
	UpdateFunctionConfigurationCommand,
} = require("@aws-sdk/client-lambda")
const {
	CloudWatchLogsClient,
	CreateLogGroupCommand,
} = require("@aws-sdk/client-cloudwatch-logs")

const lambdaClient = new LambdaClient({ region: "ap-south-1" })
const cloudwatchClient = new CloudWatchLogsClient({ region: "ap-south-1" })

const LOG_GROUP_NAME = "/aws/lambda/centralized-log-group" // Replace with your desired log group name
const LAMBDA_INSIGHTS_LAYER_ARN =
	"arn:aws:lambda:ap-south-1:580247275435:layer:LambdaInsightsExtension:50"

async function createLogGroupIfNotExists(logGroupName) {
	try {
		const command = new CreateLogGroupCommand({ logGroupName })
		await cloudwatchClient.send(command)
		console.log(`Created log group: ${logGroupName}`)
	} catch (error) {
		if (error.name !== "ResourceAlreadyExistsException") {
			throw error
		}
		console.log(`Log group already exists: ${logGroupName}`)
	}
}

async function updateFunctionConfiguration(functionName, logGroupName) {
	try {
		const getConfigCommand = new GetFunctionConfigurationCommand({
			FunctionName: functionName,
		})
		const response = await lambdaClient.send(getConfigCommand)

		// Update logging configuration
		const updatedConfig = {
			FunctionName: functionName,
			LoggingConfig: {
				LogGroup: logGroupName,
			},
		}

		await lambdaClient.send(
			new UpdateFunctionConfigurationCommand(updatedConfig),
		)
		console.log(
			`Updated logging configuration for function: ${functionName}`,
		)
	} catch (error) {
		console.error(
			`Error updating logging configuration for function ${functionName}:`,
			error,
		)
	}
}

async function enableLambdaInsightsOnFunction(functionName) {
	try {
		const getConfigCommand = new GetFunctionConfigurationCommand({
			FunctionName: functionName,
		})
		const response = await lambdaClient.send(getConfigCommand)
		const layers = response.Layers
			? response.Layers.map(layer => layer.Arn)
			: []

		if (!layers.includes(LAMBDA_INSIGHTS_LAYER_ARN)) {
			layers.push(LAMBDA_INSIGHTS_LAYER_ARN)
			const updateConfigCommand = new UpdateFunctionConfigurationCommand({
				FunctionName: functionName,
				Layers: layers,
			})

			await lambdaClient.send(updateConfigCommand)
			console.log(`Enabled Lambda Insights for function: ${functionName}`)
		} else {
			console.log(
				`Lambda Insights already enabled for function: ${functionName}`,
			)
		}
	} catch (error) {
		console.error(
			`Error enabling Insights on function ${functionName}:`,
			error,
		)
	}
}

exports.handler = async (event, context) => {
	try {
		await createLogGroupIfNotExists(LOG_GROUP_NAME)

		const listFunctionsCommand = new ListFunctionsCommand({})
		const functions = await lambdaClient.send(listFunctionsCommand)

		for (const func of functions.Functions) {
			const functionName = func.FunctionName
			await updateFunctionConfiguration(functionName, LOG_GROUP_NAME)
			await enableLambdaInsightsOnFunction(functionName)
		}
	} catch (error) {
		console.error("Error processing Lambda functions:", error)
	}
}


// // SAMPLE TESTING WITH ARRAY OF 2 LAMBDAS
// const {
// 	LambdaClient,
// 	GetFunctionConfigurationCommand,
// 	UpdateFunctionConfigurationCommand,
// } = require("@aws-sdk/client-lambda")
// const {
// 	CloudWatchLogsClient,
// 	CreateLogGroupCommand,
// } = require("@aws-sdk/client-cloudwatch-logs")

// const lambdaClient = new LambdaClient({ region: "us-east-2" })
// const cloudwatchClient = new CloudWatchLogsClient({ region: "us-east-2" })

// const LOG_GROUP_NAME = "/aws/lambda/centralized-log-group" // Replace with your desired log group name
// const LAMBDA_INSIGHTS_LAYER_ARN =
// 	"arn:aws:lambda:us-east-2:580247275435:layer:LambdaInsightsExtension:52"
// const MAX_RETRIES = 2
// const RETRY_DELAY_MS = 3000

// async function createLogGroupIfNotExists(logGroupName) {
// 	try {
// 		const command = new CreateLogGroupCommand({ logGroupName })
// 		await cloudwatchClient.send(command)
// 		console.log(`Created log group: ${logGroupName}`)
// 	} catch (error) {
// 		if (error.name !== "ResourceAlreadyExistsException") {
// 			throw error
// 		}
// 		console.log(`Log group already exists: ${logGroupName}`)
// 	}
// }

// async function updateFunctionConfiguration(
// 	functionName,
// 	logGroupName,
// 	retries = 0,
// ) {
// 	try {
// 		const getConfigCommand = new GetFunctionConfigurationCommand({
// 			FunctionName: functionName,
// 		})
// 		const response = await lambdaClient.send(getConfigCommand)

// 		// Update logging configuration
// 		const updatedConfig = {
// 			FunctionName: functionName,
// 			LoggingConfig: {
// 				LogGroup: logGroupName,
// 			},
// 		}

// 		await lambdaClient.send(
// 			new UpdateFunctionConfigurationCommand(updatedConfig),
// 		)
// 		console.log(
// 			`Updated logging configuration for function: ${functionName}`,
// 		)
// 	} catch (error) {
// 		if (
// 			error.name === "ResourceConflictException" &&
// 			retries < MAX_RETRIES
// 		) {
// 			console.warn(
// 				`Retrying update for ${functionName} due to conflict... (${
// 					retries + 1
// 				}/${MAX_RETRIES})`,
// 			)
// 			await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
// 			return updateFunctionConfiguration(
// 				functionName,
// 				logGroupName,
// 				retries + 1,
// 			)
// 		} else {
// 			console.error(
// 				`Error updating logging configuration for function ${functionName}:`,
// 				error,
// 			)
// 		}
// 	}
// }

// async function enableLambdaInsightsOnFunction(functionName, retries = 0) {
// 	try {
// 		const getConfigCommand = new GetFunctionConfigurationCommand({
// 			FunctionName: functionName,
// 		})
// 		const response = await lambdaClient.send(getConfigCommand)
// 		const layers = response.Layers
// 			? response.Layers.map(layer => layer.Arn)
// 			: []

// 		if (!layers.includes(LAMBDA_INSIGHTS_LAYER_ARN)) {
// 			layers.push(LAMBDA_INSIGHTS_LAYER_ARN)
// 			const updateConfigCommand = new UpdateFunctionConfigurationCommand({
// 				FunctionName: functionName,
// 				Layers: layers,
// 			})

// 			await lambdaClient.send(updateConfigCommand)
// 			console.log(`Enabled Lambda Insights for function: ${functionName}`)
// 		} else {
// 			console.log(
// 				`Lambda Insights already enabled for function: ${functionName}`,
// 			)
// 		}
// 	} catch (error) {
// 		if (
// 			error.name === "ResourceConflictException" &&
// 			retries < MAX_RETRIES
// 		) {
// 			console.warn(
// 				`Retrying Insights enablement for ${functionName} due to conflict... (${
// 					retries + 1
// 				}/${MAX_RETRIES})`,
// 			)
// 			await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
// 			return enableLambdaInsightsOnFunction(functionName, retries + 1)
// 		} else {
// 			console.error(
// 				`Error enabling Insights on function ${functionName}:`,
// 				error,
// 			)
// 		}
// 	}
// }
// //'python','load_balancer','rds-parameter-group'
// exports.handler = async (event, context) => {
// 	try {
// 		const functionNames = ["python", "load_balancer"] // Array of Lambda function names passed in the event
// 		await createLogGroupIfNotExists(LOG_GROUP_NAME)

// 		for (const functionName of functionNames) {
// 			await updateFunctionConfiguration(functionName, LOG_GROUP_NAME)
// 			await enableLambdaInsightsOnFunction(functionName)
// 		}
// 	} catch (error) {
// 		console.error("Error processing Lambda functions:", error)
// 	}
// }