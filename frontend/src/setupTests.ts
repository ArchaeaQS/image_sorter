import '@testing-library/jest-dom';

// Mock Electron
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock window.require for Electron
Object.defineProperty(window, 'require', {
  value: jest.fn().mockReturnValue({ ipcRenderer: mockIpcRenderer }),
  writable: true,
});

// Mock fetch for API tests
global.fetch = jest.fn();