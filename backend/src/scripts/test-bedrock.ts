/**
 * Test script for AWS Bedrock Claude Sonnet 3 Integration
 * 
 * This script tests the Bedrock service by:
 * 1. Making a simple text request
 * 2. Making a JSON request and parsing the response
 * 
 * Run with: npm run test:bedrock
 * Or directly: ts-node src/scripts/test-bedrock.ts
 */

import bedrockService from '../services/bedrock.service';

async function testBedrockIntegration() {
    console.log('='.repeat(60));
    console.log('AWS Bedrock Claude Sonnet 3 Integration Test');
    console.log('='.repeat(60));
    console.log();

    try {
        // Test 1: Simple text request
        console.log('Test 1: Simple Text Request');
        console.log('-'.repeat(60));
        const simplePrompt = 'Say hello and introduce yourself in one sentence.';
        console.log('Prompt:', simplePrompt);
        console.log();

        const simpleResponse = await bedrockService.invokeClaudeWithJSON(simplePrompt);
        const simpleText = bedrockService.extractTextFromResponse(simpleResponse);

        console.log('Response:', simpleText);
        console.log('✓ Test 1 passed');
        console.log();

        // Test 2: JSON response request
        console.log('Test 2: JSON Response Request');
        console.log('-'.repeat(60));
        const jsonPrompt = `Generate a sample user profile with the following fields:
- name (string)
- age (number)
- email (string)
- interests (array of strings, 3 items)
- isActive (boolean)`;

        console.log('Prompt:', jsonPrompt);
        console.log();

        const jsonResponse = await bedrockService.getJSONResponse(jsonPrompt);

        console.log('Parsed JSON Response:');
        console.log(JSON.stringify(jsonResponse, null, 2));
        console.log('✓ Test 2 passed');
        console.log();

        // Test 3: Energy-related JSON request (relevant to KineSave)
        console.log('Test 3: Energy Analysis JSON (KineSave Preview)');
        console.log('-'.repeat(60));
        const energyPrompt = `Analyze this smart home device usage scenario and provide recommendations:

Devices:
- Air Conditioner: 1500W, runs 8 hours/day
- Refrigerator: 200W, runs 24 hours/day
- LED Bulbs (4): 9W each, runs 6 hours/day

Location: Lagos, Nigeria (hot climate)
Electricity cost: ₦50/kWh

Provide a JSON response with:
- totalDailyConsumption (kWh)
- estimatedDailyCost (in Naira)
- recommendations (array of 3 strings)
- potentialSavings (percentage)`;

        console.log('Prompt:', energyPrompt);
        console.log();

        const energyResponse = await bedrockService.getJSONResponse(
            energyPrompt,
            'You are an energy efficiency expert. Provide accurate calculations and practical recommendations.'
        );

        console.log('Energy Analysis JSON Response:');
        console.log(JSON.stringify(energyResponse, null, 2));
        console.log('✓ Test 3 passed');
        console.log();

        console.log('='.repeat(60));
        console.log('✓ All tests passed successfully!');
        console.log('AWS Bedrock integration is working correctly.');
        console.log('='.repeat(60));

    } catch (error: any) {
        console.error();
        console.error('✗ Test failed with error:');
        console.error(error.message);
        console.error();
        console.error('Common issues:');
        console.error('1. AWS credentials not configured (run: aws configure)');
        console.error('2. Bedrock not enabled in your AWS region');
        console.error('3. Insufficient IAM permissions for Bedrock');
        console.error('4. Model not available in your region');
        console.error();
        process.exit(1);
    }
}

// Run the test
testBedrockIntegration();
