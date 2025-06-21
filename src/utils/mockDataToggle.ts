
// Global mock data toggle system
let mockDataEnabled = true;

export const enableMockData = () => {
  mockDataEnabled = true;
};

export const disableMockData = () => {
  mockDataEnabled = false;
};

export const isMockDataEnabled = () => mockDataEnabled;
