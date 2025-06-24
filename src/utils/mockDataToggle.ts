
// Real data mode - mock data system removed
export const enableMockData = () => {
  console.warn('Mock data system has been removed - using real data only');
};

export const disableMockData = () => {
  console.log('Real data mode active');
};

export const isMockDataEnabled = () => false;
