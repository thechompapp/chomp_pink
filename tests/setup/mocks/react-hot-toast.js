// Mock for react-hot-toast
const toast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
  promise: vi.fn(),
};

export default toast;
export { toast };
