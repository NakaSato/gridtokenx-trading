import { createApiClient } from '@/lib/api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client - Minting', () => {
    const TEST_TOKEN = 'test-jwt-token';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('mintReading', () => {
        const READING_ID = '12345678-1234-1234-1234-123456789abc';

        it('should call the correct endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    reading_id: READING_ID,
                    transaction_signature: 'mock-tx-sig',
                    kwh_amount: 25.5,
                    message: 'Successfully minted'
                })
            });

            const client = createApiClient(TEST_TOKEN);
            await client.mintReading(READING_ID);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(`/api/v1/meters/readings/${READING_ID}/mint`),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': `Bearer ${TEST_TOKEN}`
                    })
                })
            );
        });

        it('should return minting response on success', async () => {
            const mockResponse = {
                reading_id: READING_ID,
                transaction_signature: 'sig123',
                kwh_amount: 42.0,
                message: 'Minted successfully'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => JSON.stringify(mockResponse)
            });

            const client = createApiClient(TEST_TOKEN);
            const result = await client.mintReading(READING_ID);

            expect(result.data).toEqual(mockResponse);
            expect(result.status).toBe(200);
            expect(result.error).toBeUndefined();
        });

        it('should handle 400 error for already minted reading', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({
                    message: 'Reading has already been minted'
                })
            });

            const client = createApiClient(TEST_TOKEN);
            const result = await client.mintReading(READING_ID);

            expect(result.status).toBe(400);
            expect(result.error).toBeDefined();
        });

        it('should handle 404 error for non-existent reading', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => JSON.stringify({
                    message: 'Reading not found'
                })
            });

            const client = createApiClient(TEST_TOKEN);
            const result = await client.mintReading('non-existent-id');

            expect(result.status).toBe(404);
            expect(result.error).toBeDefined();
        });

        it('should handle 401 unauthorized error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => JSON.stringify({
                    message: 'Unauthorized'
                })
            });

            const client = createApiClient(TEST_TOKEN);
            const result = await client.mintReading(READING_ID);

            expect(result.status).toBe(401);
            expect(result.error).toBeDefined();
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const client = createApiClient(TEST_TOKEN);
            const result = await client.mintReading(READING_ID);

            expect(result.error).toBeDefined();
            expect(result.status).toBe(500); // Network errors return 500
        });

        it('should handle server errors (500)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => JSON.stringify({
                    message: 'Internal server error'
                })
            });

            const client = createApiClient(TEST_TOKEN);
            const result = await client.mintReading(READING_ID);

            expect(result.status).toBe(500);
            expect(result.error).toBeDefined();
        });
    });
});

describe('Minting Stats Calculations', () => {

    const mockReadings = [
        { id: '1', kwh: 25.0, minted: true },
        { id: '2', kwh: 15.0, minted: false },
        { id: '3', kwh: 30.0, minted: true },
        { id: '4', kwh: -10.0, minted: false }, // consumption
        { id: '5', kwh: 20.0, minted: false },
    ];

    it('should calculate total minted correctly', () => {
        const mintedReadings = mockReadings.filter(r => r.minted);
        const totalMinted = mintedReadings.reduce((acc, r) => acc + r.kwh, 0);

        expect(totalMinted).toBe(55.0); // 25 + 30
    });

    it('should calculate pending to mint correctly', () => {
        const pendingReadings = mockReadings.filter(r => !r.minted && r.kwh > 0);
        const pendingToMint = pendingReadings.reduce((acc, r) => acc + r.kwh, 0);

        expect(pendingToMint).toBe(35.0); // 15 + 20 (excludes consumption)
    });

    it('should count minted readings correctly', () => {
        const mintedCount = mockReadings.filter(r => r.minted).length;

        expect(mintedCount).toBe(2);
    });

    it('should count pending readings correctly', () => {
        const pendingCount = mockReadings.filter(r => !r.minted && r.kwh > 0).length;

        expect(pendingCount).toBe(2);
    });

    it('should identify consumption readings', () => {
        const consumptionReadings = mockReadings.filter(r => r.kwh < 0);

        expect(consumptionReadings.length).toBe(1);
        expect(consumptionReadings[0].kwh).toBe(-10.0);
    });

    it('should not include consumption in pending mints', () => {
        const pendingReadings = mockReadings.filter(r => !r.minted && r.kwh > 0);

        // Should not include the -10 kWh consumption reading
        expect(pendingReadings.every(r => r.kwh > 0)).toBe(true);
    });
});

describe('Minting UI Logic', () => {

    it('should determine if reading can be minted', () => {
        const canMint = (reading: { minted: boolean; kwh: number }) => {
            return !reading.minted && reading.kwh > 0;
        };

        expect(canMint({ minted: false, kwh: 25 })).toBe(true);
        expect(canMint({ minted: true, kwh: 25 })).toBe(false);
        expect(canMint({ minted: false, kwh: -10 })).toBe(false);
        expect(canMint({ minted: false, kwh: 0 })).toBe(false);
    });

    it('should format token amount correctly', () => {
        const formatTokenAmount = (kwh: number) => `${kwh.toFixed(2)} GRX`;

        expect(formatTokenAmount(25.5)).toBe('25.50 GRX');
        expect(formatTokenAmount(100)).toBe('100.00 GRX');
        expect(formatTokenAmount(0.5)).toBe('0.50 GRX');
    });

    it('should truncate transaction signature for display', () => {
        const truncateSig = (sig: string, length = 12) => {
            if (!sig || sig.length <= length) return sig;
            return `${sig.slice(0, length)}...`;
        };

        const fullSig = '5xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx';
        expect(truncateSig(fullSig)).toBe('5xyz789abc12...');
        expect(truncateSig('short')).toBe('short');
        expect(truncateSig('')).toBe('');
    });
});
