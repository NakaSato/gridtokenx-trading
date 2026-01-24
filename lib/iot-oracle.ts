/**
 * IoT Oracle Mock for GridTokenX
 * 
 * Simulates a smart meter streaming energy readings.
 */

export interface MeterReading {
    id: string;
    value: number;
    timestamp: number;
    origin: 'Solar' | 'Wind';
}

export class IoTOracle {
    private readings: MeterReading[] = [];
    private onThresholdMet: (readings: number[]) => void;
    private threshold: number;
    private currentSum: number = 0;

    constructor(threshold: number, onThresholdMet: (readings: number[]) => void) {
        this.threshold = threshold;
        this.onThresholdMet = onThresholdMet;
    }

    /**
     * Simulates receiving a new reading from a physical meter
     */
    public simulateReading() {
        const value = Math.floor(Math.random() * 50) + 10; // 10-60 kWh
        const reading: MeterReading = {
            id: `METER-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            value,
            timestamp: Date.now(),
            origin: Math.random() > 0.5 ? 'Solar' : 'Wind'
        };

        this.readings.push(reading);
        this.currentSum += value;

        if (this.currentSum >= this.threshold) {
            const batch = this.readings.map(r => r.value);
            this.onThresholdMet(batch);
            this.readings = [];
            this.currentSum = 0;
        }

        return reading;
    }

    public getStatus() {
        return {
            accumulated: this.currentSum,
            threshold: this.threshold,
            percentage: (this.currentSum / this.threshold) * 100,
            pendingCount: this.readings.length
        };
    }
}
