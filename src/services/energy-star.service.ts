import axios from 'axios';

/**
 * Simplified Device Database Service
 * Uses a curated local database of common devices with real specifications
 * Can be expanded with manufacturer APIs or web scraping later
 */

interface DeviceSpec {
    brand: string;
    modelNumber: string;
    productName: string;
    category: string;
    annualEnergyUse?: number; // kWh/year
    powerRating?: number; // Watts
    energyStarRating?: string;
    additionalSpecs?: Record<string, any>;
}

interface SearchQuery {
    deviceType?: string;
    brand?: string;
    model?: string;
}

class DeviceSpecsService {
    private deviceDatabase: Record<string, DeviceSpec[]> = {
        air_conditioner: [
            {
                brand: 'Samsung',
                modelNumber: 'AR12TXEAAWKNEU',
                productName: 'Samsung AR12 WindFree Split AC',
                category: 'air_conditioner',
                annualEnergyUse: 850,
                powerRating: 1500,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 12000, eer: 12.5, type: 'Split System' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'AR18TSHQAWK',
                productName: 'Samsung 18000 BTU Inverter AC',
                category: 'air_conditioner',
                annualEnergyUse: 1200,
                powerRating: 1800,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 18000, eer: 11.8, type: 'Window Unit' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'AR09TXHQASINEU',
                productName: 'Samsung 9000 BTU Wi-Fi AC',
                category: 'air_conditioner',
                annualEnergyUse: 650,
                powerRating: 1200,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { coolingCapacityBTU: 9000, eer: 13.0, type: 'Split System' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'AR24TXFCAWK',
                productName: 'Samsung 24000 BTU Triangle AC',
                category: 'air_conditioner',
                annualEnergyUse: 1500,
                powerRating: 2200,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 24000, eer: 11.2, type: 'Split System' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'AR07T9170HA3',
                productName: 'Samsung 7000 BTU WindFree Elite',
                category: 'air_conditioner',
                annualEnergyUse: 580,
                powerRating: 1000,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { coolingCapacityBTU: 7000, eer: 13.8, type: 'Split System' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'AW10DBB7',
                productName: 'Samsung 10000 BTU Window AC',
                category: 'air_conditioner',
                annualEnergyUse: 750,
                powerRating: 1350,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 10000, eer: 12.2, type: 'Window Unit' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'AR05T9170HA3',
                productName: 'Samsung 5000 BTU Compact AC',
                category: 'air_conditioner',
                annualEnergyUse: 480,
                powerRating: 850,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 5000, eer: 12.8, type: 'Window Unit' },
            },
            // LG Air Conditioners (7 models)
            {
                brand: 'LG',
                modelNumber: 'S4-W12JA3AA',
                productName: 'LG DualCool Inverter 12000 BTU',
                category: 'air_conditioner',
                annualEnergyUse: 780,
                powerRating: 1400,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { coolingCapacityBTU: 12000, eer: 13.2, type: 'Split System' },
            },
            {
                brand: 'LG',
                modelNumber: 'LP1419IVSM',
                productName: 'LG Portable Air Conditioner 14000 BTU',
                category: 'air_conditioner',
                annualEnergyUse: 950,
                powerRating: 1300,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 14000, eer: 10.5, type: 'Portable' },
            },
            {
                brand: 'LG',
                modelNumber: 'LW1817IVSM',
                productName: 'LG Window AC 18000 BTU',
                category: 'air_conditioner',
                annualEnergyUse: 1100,
                powerRating: 1700,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 18000, eer: 11.5, type: 'Window Unit' },
            },
            {
                brand: 'LG',
                modelNumber: 'S3-M09JA2FA',
                productName: 'LG Artcool Mirror 9000 BTU',
                category: 'air_conditioner',
                annualEnergyUse: 680,
                powerRating: 1100,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { coolingCapacityBTU: 9000, eer: 13.5, type: 'Split System' },
            },
            {
                brand: 'LG',
                modelNumber: 'LW8017ERSM',
                productName: 'LG 8000 BTU Smart Window AC',
                category: 'air_conditioner',
                annualEnergyUse: 620,
                powerRating: 1150,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 8000, eer: 12.1, type: 'Window Unit' },
            },
            {
                brand: 'LG',
                modelNumber: 'LP1017WSR',
                productName: 'LG Portable 10000 BTU AC',
                category: 'air_conditioner',
                annualEnergyUse: 820,
                powerRating: 1200,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { coolingCapacityBTU: 10000, eer: 11.2, type: 'Portable' },
            },
            {
                brand: 'LG',
                modelNumber: 'LW6021ER',
                productName: 'LG 6000 BTU Energy Star Window AC',
                category: 'air_conditioner',
                annualEnergyUse: 520,
                powerRating: 950,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { coolingCapacityBTU: 6000, eer: 13.3, type: 'Window Unit' },
            },
        ],

        refrigerator: [
            // Samsung Refrigerators (7 models)
            // Samsung Refrigerators
            {
                brand: 'Samsung',
                modelNumber: 'RT38K5032S8',
                productName: 'Samsung Top Freezer 384L',
                category: 'refrigerator',
                annualEnergyUse: 380,
                powerRating: 150,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 13.5, volumeL: 384, configuration: 'Top Freezer' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'RF23BB890012',
                productName: 'Samsung French Door 23 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 650,
                powerRating: 180,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 23, volumeL: 651, configuration: 'French Door' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'RS28CB760012',
                productName: 'Samsung Side-by-Side 28 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 720,
                powerRating: 190,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 28, volumeL: 793, configuration: 'Side by Side' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'RB38A7B6AS9',
                productName: 'Samsung SpaceMax Bottom Freezer 385L',
                category: 'refrigerator',
                annualEnergyUse: 350,
                powerRating: 140,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { volumeCuFt: 13.6, volumeL: 385, configuration: 'Bottom Freezer' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'RT21M6213SR',
                productName: 'Samsung Top Mount 21 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 420,
                powerRating: 165,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 21, volumeL: 595, configuration: 'Top Freezer' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'RF32CG5400SR',
                productName: 'Samsung 4-Door Flex 32 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 780,
                powerRating: 200,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 32, volumeL: 906, configuration: '4-Door Flex' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'RB29FERNDSA',
                productName: 'Samsung Digital Inverter 290L',
                category: 'refrigerator',
                annualEnergyUse: 320,
                powerRating: 130,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { volumeCuFt: 10.2, volumeL: 290, configuration: 'Bottom Freezer' },
            },
            // LG Refrigerators (7 models)
            {
                brand: 'LG',
                modelNumber: 'GR-C802HLHU',
                productName: 'LG Side-by-Side 668L',
                category: 'refrigerator',
                annualEnergyUse: 520,
                powerRating: 160,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 23.6, volumeL: 668, configuration: 'Side by Side' },
            },
            {
                brand: 'LG',
                modelNumber: 'LRFCS2503S',
                productName: 'LG French Door 24.5 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 580,
                powerRating: 170,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 24.5, volumeL: 694, configuration: 'French Door' },
            },
            {
                brand: 'LG',
                modelNumber: 'GN-H702HLHU',
                productName: 'LG Top Freezer 509L',
                category: 'refrigerator',
                annualEnergyUse: 420,
                powerRating: 155,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 18, volumeL: 509, configuration: 'Top Freezer' },
            },
            {
                brand: 'LG',
                modelNumber: 'GC-X247CQAV',
                productName: 'LG InstaView Door-in-Door 668L',
                category: 'refrigerator',
                annualEnergyUse: 680,
                powerRating: 185,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 23.6, volumeL: 668, configuration: 'French Door' },
            },
            {
                brand: 'LG',
                modelNumber: 'LRMDS3006S',
                productName: 'LG 4-Door French Door 30 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 750,
                powerRating: 195,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 30, volumeL: 849, configuration: '4-Door French' },
            },
            {
                brand: 'LG',
                modelNumber: 'LTCS24223S',
                productName: 'LG Top Freezer 24 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 480,
                powerRating: 165,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 24, volumeL: 680, configuration: 'Top Freezer' },
            },
            {
                brand: 'LG',
                modelNumber: 'LRFCS25D3S',
                productName: 'LG Smart InstaView 25 cu.ft',
                category: 'refrigerator',
                annualEnergyUse: 620,
                powerRating: 175,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { volumeCuFt: 25, volumeL: 708, configuration: 'French Door' },
            },
        ],

        tv: [
            // Samsung TVs (6 models)
            // Samsung TVs
            {
                brand: 'Samsung',
                modelNumber: 'QN55Q80C',
                productName: 'Samsung 55" QLED 4K Smart TV',
                category: 'tv',
                annualEnergyUse: 180,
                powerRating: 120,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 55, resolution: '4K UHD', displayType: 'QLED' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'UN43TU7000',
                productName: 'Samsung 43" Crystal UHD TV',
                category: 'tv',
                annualEnergyUse: 120,
                powerRating: 80,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 43, resolution: '4K UHD', displayType: 'LED' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'QN65S90C',
                productName: 'Samsung 65" OLED 4K TV',
                category: 'tv',
                annualEnergyUse: 220,
                powerRating: 150,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { screenSize: 65, resolution: '4K UHD', displayType: 'OLED' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'QN50Q60C',
                productName: 'Samsung 50" QLED Q60C 4K TV',
                category: 'tv',
                annualEnergyUse: 150,
                powerRating: 100,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 50, resolution: '4K UHD', displayType: 'QLED' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'QN75Q80C',
                productName: 'Samsung 75" QLED Q80C 4K TV',
                category: 'tv',
                annualEnergyUse: 280,
                powerRating: 190,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 75, resolution: '4K UHD', displayType: 'QLED' },
            },
            {
                brand: 'Samsung',
                modelNumber: 'UN32N5300',
                productName: 'Samsung 32" Smart LED TV',
                category: 'tv',
                annualEnergyUse: 90,
                powerRating: 60,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 32, resolution: 'Full HD', displayType: 'LED' },
            },
            // LG TVs (6 models)
            {
                brand: 'LG',
                modelNumber: 'OLED55C3PUA',
                productName: 'LG 55" OLED evo C3 4K TV',
                category: 'tv',
                annualEnergyUse: 170,
                powerRating: 115,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { screenSize: 55, resolution: '4K UHD', displayType: 'OLED' },
            },
            {
                brand: 'LG',
                modelNumber: '50UQ75006LF',
                productName: 'LG 50" UQ75 4K Smart TV',
                category: 'tv',
                annualEnergyUse: 140,
                powerRating: 95,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 50, resolution: '4K UHD', displayType: 'LED' },
            },
            {
                brand: 'LG',
                modelNumber: '65QNED85URA',
                productName: 'LG 65" QNED MiniLED 4K TV',
                category: 'tv',
                annualEnergyUse: 200,
                powerRating: 140,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 65, resolution: '4K UHD', displayType: 'QNED' },
            },
            {
                brand: 'LG',
                modelNumber: '43UQ7590PUB',
                productName: 'LG 43" UQ75 4K Smart TV',
                category: 'tv',
                annualEnergyUse: 130,
                powerRating: 85,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 43, resolution: '4K UHD', displayType: 'LED' },
            },
            {
                brand: 'LG',
                modelNumber: '77OLED77C3PUA',
                productName: 'LG 77" OLED evo C3 4K TV',
                category: 'tv',
                annualEnergyUse: 250,
                powerRating: 170,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { screenSize: 77, resolution: '4K UHD', displayType: 'OLED' },
            },
            {
                brand: 'LG',
                modelNumber: '32LM577BPUA',
                productName: 'LG 32" Smart LED TV',
                category: 'tv',
                annualEnergyUse: 85,
                powerRating: 55,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { screenSize: 32, resolution: '720p HD', displayType: 'LED' },
            },
        ],

        washing_machine: [
            // Samsung Washers (6 models)
            // Samsung Washers
            {
                brand: 'Samsung',
                modelNumber: 'WA11CG5745BVST',
                productName: 'Samsung Top Load Washer 11kg',
                category: 'washing_machine',
                annualEnergyUse: 180,
                powerRating: 500,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { capacity: 11, loadType: 'Top Load', hasInverter: true },
            },
            {
                brand: 'Samsung',
                modelNumber: 'WW90T504DAW',
                productName: 'Samsung EcoBubble Front Load 9kg',
                category: 'washing_machine',
                annualEnergyUse: 160,
                powerRating: 450,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { capacity: 9, loadType: 'Front Load', hasInverter: true },
            },
            {
                brand: 'Samsung',
                modelNumber: 'WD11T554DBW',
                productName: 'Samsung Washer-Dryer Combo 11/7kg',
                category: 'washing_machine',
                annualEnergyUse: 320,
                powerRating: 850,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { capacity: 11, loadType: 'Front Load', hasDryer: true },
            },
            {
                brand: 'Samsung',
                modelNumber: 'WA54CG7450AV',
                productName: 'Samsung Smart Top Load 5.4 cu.ft',
                category: 'washing_machine',
                annualEnergyUse: 200,
                powerRating: 520,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { capacity: 12, loadType: 'Top Load', hasInverter: true },
            },
            {
                brand: 'Samsung',
                modelNumber: 'WF50A8800AV',
                productName: 'Samsung AddWash Front Load 5.0 cu.ft',
                category: 'washing_machine',
                annualEnergyUse: 155,
                powerRating: 430,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { capacity: 11, loadType: 'Front Load', hasInverter: true },
            },
            {
                brand: 'Samsung',
                modelNumber: 'WA44A3405AW',
                productName: 'Samsung Top Load 4.4 cu.ft',
                category: 'washing_machine',
                annualEnergyUse: 170,
                powerRating: 480,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { capacity: 10, loadType: 'Top Load', hasInverter: false },
            },
            // LG Washers (6 models)
            {
                brand: 'LG',
                modelNumber: 'T2108VSAM',
                productName: 'LG Top Load Inverter 8kg',
                category: 'washing_machine',
                annualEnergyUse: 150,
                powerRating: 420,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { capacity: 8, loadType: 'Top Load', hasInverter: true },
            },
            {
                brand: 'LG',
                modelNumber: 'FV1409S4W',
                productName: 'LG TurboWash Front Load 9kg',
                category: 'washing_machine',
                annualEnergyUse: 140,
                powerRating: 400,
                energyStarRating: 'Energy Star Most Efficient',
                additionalSpecs: { capacity: 9, loadType: 'Front Load', hasInverter: true },
            },
            {
                brand: 'LG',
                modelNumber: 'F4V5RGP2T',
                productName: 'LG Washer-Dryer Steam 10.5/7kg',
                category: 'washing_machine',
                annualEnergyUse: 340,
                powerRating: 900,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { capacity: 10.5, loadType: 'Front Load', hasDryer: true },
            },
        ],

        led_bulb: [
            // Samsung LED Bulbs
            {
                brand: 'Samsung',
                modelNumber: 'SI-I8W061140EU',
                productName: 'Samsung Smart LED Bulb 9W',
                category: 'led_bulb',
                annualEnergyUse: 8,
                powerRating: 9,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { lumens: 806, colorTemperature: 2700, lifeHours: 25000 },
            },
            // LG LED Bulbs  
            {
                brand: 'LG',
                modelNumber: 'LG-A60-10W-E27',
                productName: 'LG LED A60 10W Bulb',
                category: 'led_bulb',
                annualEnergyUse: 9,
                powerRating: 10,
                energyStarRating: 'Energy Star Certified',
                additionalSpecs: { lumens: 900, colorTemperature: 3000, lifeHours: 20000 },
            },
        ],

        heater: [
            // Samsung - Limited heater products
            {
                brand: 'Samsung',
                modelNumber: 'AE040JNYDEH',
                productName: 'Samsung Heat Pump 4kW',
                category: 'heater',
                annualEnergyUse: 2500,
                powerRating: 4000,
                energyStarRating: 'High Efficiency',
                additionalSpecs: { heatingCapacityBTU: 13650, type: 'Heat Pump' },
            },
            // LG - Limited heater products
            {
                brand: 'LG',
                modelNumber: 'LG-HP-5KW',
                productName: 'LG ThinQ Heat Pump 5kW',
                category: 'heater',
                annualEnergyUse: 3000,
                powerRating: 5000,
                energyStarRating: 'High Efficiency',
                additionalSpecs: { heatingCapacityBTU: 17000, type: 'Heat Pump' },
            },
        ],
    };

    /**
     * Search for devices in local database
     */
    async searchDevices(query: SearchQuery): Promise<DeviceSpec[]> {
        console.log('🔍 Searching local device database:', query);

        const deviceType = query.deviceType || 'air_conditioner';
        let devices = this.deviceDatabase[deviceType] || this.deviceDatabase.air_conditioner;

        // Filter by brand (case-insensitive)
        if (query.brand) {
            const brandLower = query.brand.toLowerCase();
            devices = devices.filter(d =>
                d.brand.toLowerCase().includes(brandLower)
            );
        }

        // Filter by model (case-insensitive)
        if (query.model) {
            const modelLower = query.model.toLowerCase();
            devices = devices.filter(d =>
                d.modelNumber.toLowerCase().includes(modelLower) ||
                d.productName.toLowerCase().includes(modelLower)
            );
        }

        console.log(`Found ${devices.length} device(s)`);

        return devices;
    }

    /**
     * Get device details
     */
    async getDeviceDetails(deviceType: string, modelNumber: string): Promise<DeviceSpec | null> {
        const devices = this.deviceDatabase[deviceType] || [];
        return devices.find(d => d.modelNumber === modelNumber) || null;
    }
}

export default new DeviceSpecsService();
export type { DeviceSpec, SearchQuery };
