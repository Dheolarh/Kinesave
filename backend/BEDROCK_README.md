# AWS Bedrock Claude Sonnet 3 Integration

This directory contains the AWS Bedrock integration for KineSave, enabling AI-powered energy analysis using Claude Sonnet 3.

## 🚀 Quick Start

### Prerequisites
- AWS account with Bedrock enabled
- AWS CLI configured (`aws configure`)
- Node.js and npm installed

### Installation

The AWS Bedrock SDK is already installed. If you need to reinstall:

```bash
npm install @aws-sdk/client-bedrock-runtime
```

### Configuration

1. Copy the environment template (optional):
```bash
cp .env.example .env
```

2. Edit `.env` to set your AWS region (default: us-east-1):
```
AWS_REGION=us-east-1
```

3. Ensure AWS credentials are configured:
```bash
aws configure
```

## 🧪 Testing

Run the comprehensive test script:

```bash
npm run test:bedrock
```

This will run 3 tests:
1. **Simple Text Request** - Basic Claude invocation
2. **JSON Response** - Structured data parsing
3. **Energy Analysis** - KineSave-relevant scenario with calculations

Expected output:
```
✓ Test 1 passed
✓ Test 2 passed  
✓ Test 3 passed
✓ All tests passed successfully!
```

## 📁 Files

### `src/services/bedrock.service.ts`
Main service for AWS Bedrock integration.

**Key Methods:**
- `invokeClaudeWithJSON(prompt, systemPrompt?)` - Raw invocation
- `extractTextFromResponse(response)` - Extract text from response
- `getJSONResponse(prompt, systemPrompt?)` - Get parsed JSON

**Example Usage:**
```typescript
import bedrockService from './services/bedrock.service';

// Simple text request
const response = await bedrockService.invokeClaudeWithJSON(
    'Explain solar panels in one sentence'
);
const text = bedrockService.extractTextFromResponse(response);

// JSON request
const data = await bedrockService.getJSONResponse(
    'Provide energy usage stats in JSON format'
);
```

### `src/scripts/test-bedrock.ts`
Standalone test script demonstrating all features.

Run with:
```bash
npm run test:bedrock
```

## 🔧 Configuration

### Model ID
Currently using: `anthropic.claude-3-sonnet-20240229-v1:0`

To change the model, edit `src/services/bedrock.service.ts`:
```typescript
private modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0';
```

Available models:
- Claude 3 Sonnet: `anthropic.claude-3-sonnet-20240229-v1:0`
- Claude 3 Haiku: `anthropic.claude-3-haiku-20240307-v1:0`
- Claude 3.5 Sonnet: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### Parameters
Adjust in `invokeClaudeWithJSON()`:
- `max_tokens`: 4096 (max response length)
- `temperature`: 0.7 (creativity, 0-1)

## 🌍 Supported AWS Regions

Bedrock with Claude is available in:
- `us-east-1` (N. Virginia) ✓ Default
- `us-west-2` (Oregon)
- `ap-southeast-1` (Singapore)
- `eu-central-1` (Frankfurt)

## 🔒 IAM Permissions

Your AWS user/role needs:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
        }
    ]
}
```

## ❌ Troubleshooting

**Error: "Access Denied"**
- Check IAM permissions
- Verify Bedrock is enabled in your region
- Ensure model access is granted in Bedrock console

**Error: "ResourceNotFoundException"**
- Model not available in your region
- Try changing `AWS_REGION` to `us-east-1`

**Error: "Credentials not configured"**
- Run `aws configure`
- Or set environment variables:
  ```bash
  export AWS_ACCESS_KEY_ID=your_key
  export AWS_SECRET_ACCESS_KEY=your_secret
  ```

**Error: "Model not found"**
- Request model access in AWS Bedrock console
- Go to: AWS Console → Bedrock → Model access

## 🔜 Future KineSave Integration

This is a standalone test setup. Future integration will include:
- Energy plan generation endpoint
- Device optimization recommendations
- Cost analysis and forecasting
- Smart scheduling suggestions

## 📚 Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
