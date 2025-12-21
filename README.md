# **KineSave**

KineSave is a smart energy management application designed to help users monitor, analyze, and optimize their home energy consumption. By leveraging AI-driven insights and real-time weather data, KineSave provides personalized saving plans tailored to a user's specific location and device usage.

## **Key Features**

* AI-Powered Energy Analysis: Utilizes a 3-stage AI architecture via AWS Bedrock to allocate device usage, analyze costs, and generate actionable efficiency tips.  
* Intelligent Planning: Offers three distinct optimization tiers that adjust analysis depth from 16 to 30 days and refine weather accuracy.  
* Proactive Weather Monitoring: Includes an hourly monitoring service that adjusts energy recommendations based on real-time weather changes and extreme conditions.  
* Automated Notifications: Employs a daily scheduler that sends reminders and updates to keep users on track with their saving goals.  
* Dynamic Dashboard: Provides a centralized view of all added devices, active saving plans, and current localized weather metrics.  
* Mobile-First Design: Built with a responsive interface using Radix UI primitives and Tailwind CSS for a seamless experience across devices.

## **Tech Stack**

* Frontend: React 18, Vite, TypeScript, Tailwind CSS  
* State and UI: Radix UI, Framer Motion, Lucide React, Sonner (Toasts)  
* AI and Backend Services: AWS Bedrock (Claude 3 Sonnet), AWS Cognito  
* External APIs: Open-Meteo (Free weather data), OpenWeatherMap (Premium weather data)

## **Project Structure**

| Directory / File | Description |
| :---- | :---- |
| **src/components/** | Reusable UI components and business-specific modals. |
| **src/components/ui/** | Low-level design system primitives (Radix UI wrappers). |
| **src/services/** | Core business logic: AI analysis, weather monitoring, and plan generation. |
| **src/screens/** | Primary application pages (Dashboard, AI Analysis, Plans, Settings). |
| **src/utils/** | Helper functions for location, device types, and browser-based storage. |
| **src/types/** | Centralized TypeScript interfaces for AI plans and notifications. |
| **src/contexts/** | React context providers for global state (e.g., Toast notifications). |
| **src/styles/** | Global CSS definitions and Tailwind configurations. |
| **src/App.tsx** | Main application entry point and background service initialization. |
| **src/config/** | Feature flags and subscription tier configurations. |

## **Configuration**

The project uses environment variables for AWS and weather service integrations. Refer to the .env.example file to set up your environment:

### **Environment Variables**

* VITE\_AWS\_REGION: Your specified AWS region.  
* VITE\_AWS\_ACCESS\_KEY\_ID: Your AWS IAM access key.  
* VITE\_AWS\_SECRET\_ACCESS\_KEY: Your AWS IAM secret key.  
* VITE\_OPENWEATHER\_API\_KEY: Required only for the Premium Tier features.

### **Feature Flags**

Analysis behavior can be toggled in src/config/features.ts:

* use30DayAnalysis: Toggles between 16-day and 30-day planning cycles.  
* usePremiumWeatherAPI: Enables high-accuracy climatic forecasts via OpenWeatherMap.

## **Getting Started**

1. Install dependencies:  
   npm install  
2. Run the development server:  
   npm run dev  
3. Build for production:  
   npm run build