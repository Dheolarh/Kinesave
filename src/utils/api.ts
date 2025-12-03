// API client for KineSave Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface MatterDevice {
    id: string;
    name: string;
    type: string;
    power?: number;
    status: 'active' | 'inactive';
    vendorId?: string;
    productId?: string;
    discriminator?: string;
    port?: number;
}

export interface EnergyStarDevice {
  brand: string;
  modelNumber: string;
  productName: string;
  category: string;
  annualEnergyUse?: number;
  energyStarRating?: string;
  additionalSpecs?: any;
}

export interface DeviceSearchResult {
  found: boolean;
  count: number;
  devices: EnergyStarDevice[];
}

/**
 * Search Energy Star database for devices
 */
export async function searchDevices(query: {
  deviceType?: string;
  brand?: string;
  model?: string;
}): Promise<DeviceSearchResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });
    
    if (!response.ok) {
      throw new Error('Failed to search devices');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching devices:', error);
    throw error;
  }
}

/**
 * Add device to user's home
 */
export async function addDevice(device: {
  brand: string;
  modelNumber: string;
  productName: string;
  deviceType: string;
  room: string;
  customName?: string;
  energyStarSpecs: any;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(device),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add device');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding device:', error);
    throw error;
  }
}

/**
 * Fetch user's devices
 */
export async function getUserDevices(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices`);
    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
}

/**
 * Get survey questions for a device
 */
export async function getSurveyQuestions(deviceId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/survey`);
    if (!response.ok) {
      throw new Error('Failed to get survey questions');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting survey:', error);
    throw error;
  }
}

/**
 * Submit usage survey for a device
 */
export async function submitSurvey(deviceId: string, answers: {
  frequency: string;
  hoursPerDay: number;
  usageTimes: string[];
  room: string;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answers),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit survey');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting survey:', error);
    throw error;
  }
}
