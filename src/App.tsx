import { RouterProvider } from 'react-router';
import { useEffect } from 'react';
import { router } from './utils/routes';
import notificationScheduler from './services/notification-scheduler.service';
import notificationService from './services/notification.service';
import weatherMonitor from './services/weather-monitor.service';

function App() {
  useEffect(() => {
    // Request notification permission
    notificationService.requestPermission().then((granted) => {
      if (granted) {
        console.log('Notification permission granted');
        // Start notification scheduler for daily reminders
        notificationScheduler.start();
        // Start weather monitoring (hourly checks)
        weatherMonitor.start();
      } else {
        console.log('Notification permission denied');
      }
    });

    // Cleanup on unmount
    return () => {
      notificationScheduler.stop();
      weatherMonitor.stop();
    };
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
