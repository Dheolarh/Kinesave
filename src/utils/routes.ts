import { createBrowserRouter } from "react-router";
import SplashScreen from "../screens/SplashScreen";
import LocationDetection from "../screens/LocationDetection";
import EnergyCostSetup from "../screens/EnergyCostSetup";

import Dashboard from "../screens/Dashboard";
import DeviceDetails from "../screens/DeviceDetails";
import AIAnalysis from "../screens/AIAnalysis";
import PlanDetails from "../screens/PlanDetails";
import Plans from "../screens/Plans";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/location",
    Component: LocationDetection,
  },
  {
    path: "/setup",
    Component: EnergyCostSetup,
  },

  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/device/:id",
    Component: DeviceDetails,
  },
  {
    path: "/ai-analysis",
    Component: AIAnalysis,
  },
  {
    path: "/plans",
    Component: Plans,
  },
  {
    path: "/plan/:id",
    Component: PlanDetails,
  },
]);
