const { LambdaClient, GetFunctionConfigurationCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'ap-south-1' });

const LAMBDA_INSIGHTS_LAYER_ARN = 'arn:aws:lambda:ap-south-1:580247275435:layer:LambdaInsightsExtension:50';

async function enableLambdaInsightsOnFunction(functionName) {
    try {
        const getConfigCommand = new GetFunctionConfigurationCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(getConfigCommand);
        const layers = response.Layers ? response.Layers.map(layer => layer.Arn) : [];

        if (!layers.includes(LAMBDA_INSIGHTS_LAYER_ARN)) {
            layers.push(LAMBDA_INSIGHTS_LAYER_ARN);
            const updateConfigCommand = new UpdateFunctionConfigurationCommand({
                FunctionName: functionName,
                Layers: layers
            });
            await lambdaClient.send(updateConfigCommand);

            console.log(`Enabled Lambda Insights for function: ${functionName}`);
        } else {
            console.log(`Lambda Insights already enabled for function: ${functionName}`);
        }
    } catch (error) {
        console.error(`Error enabling Insights on function ${functionName}:`, error);
    }
}

exports.handler = async (event, context) => {
    try {
        const functionNames = ['control-tower','majumal-boys']; // Expecting an array of function names in the event

        if (!Array.isArray(functionNames)) {
            throw new Error('functionNames must be an array');
        }

        for (const functionName of functionNames) {
            await enableLambdaInsightsOnFunction(functionName);
        }
    } catch (error) {
        console.error('Error processing functions:', error);
    }
};
