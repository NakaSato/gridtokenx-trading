# Testing Documentation

This project uses Jest and React Testing Library for unit and integration testing.

## Setup

First, install the testing dependencies:

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (useful during development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Files

### WalletModal Component Tests
**Location:** `components/__tests__/WalletModal.test.tsx`

Comprehensive tests for the WalletModal component covering:

#### Wallet Connection Mode
- ✅ Renders wallet connection options
- ✅ Displays all wallet providers (Phantom, Solflare, Trust)
- ✅ Switches between authentication modes

#### Sign In Mode
- ✅ Form rendering with all fields
- ✅ Field validation (username, password length)
- ✅ Successful login flow
- ✅ Error handling (401, 403, 400)
- ✅ Token storage (localStorage vs sessionStorage)
- ✅ Remember me functionality
- ✅ Password visibility toggle

#### Sign Up Mode
- ✅ Form rendering with all required fields
- ✅ Field validation (username, email, names, password)
- ✅ Email format validation
- ✅ Password matching
- ✅ Terms agreement requirement
- ✅ Optional wallet address validation
- ✅ Successful registration flow
- ✅ Error handling (400, 500)
- ✅ Role selection

### API Client Tests
**Location:** `lib/__tests__/api-client.test.ts`

Tests for the API client covering:

#### Login Endpoint
- ✅ Correct request format
- ✅ Successful authentication
- ✅ 401 Unauthorized handling
- ✅ 403 Email not verified handling
- ✅ Network error handling

#### Register Endpoint
- ✅ Correct request format with all fields
- ✅ Optional wallet address handling
- ✅ Successful registration (201)
- ✅ 400 User already exists
- ✅ 400 Validation errors
- ✅ 500 Server errors

#### Client Instance
- ✅ Token management (set/clear)
- ✅ Authorization header injection

## Coverage Goals

We aim for the following coverage metrics:
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## Writing New Tests

### Component Tests
When testing components, follow this structure:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import YourComponent from "../YourComponent";

describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    await user.click(screen.getByRole("button"));
    
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

### API Tests
When testing API calls, mock fetch:

```typescript
import { yourApiFunction } from "../api";

global.fetch = jest.fn();

describe("API Function", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("should make correct API call", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const result = await yourApiFunction();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/endpoint"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
```

## Best Practices

1. **Test User Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal component state directly

2. **Use Testing Library Queries**
   - Prefer `getByRole` over `getByTestId`
   - Use `getByLabelText` for form inputs
   - Use `getByText` for visible text

3. **Mock External Dependencies**
   - Always mock API calls
   - Mock third-party libraries when needed
   - Keep mocks simple and focused

4. **Write Descriptive Test Names**
   - Use "should" statements
   - Be specific about what is being tested
   - Include the expected outcome

5. **Keep Tests Independent**
   - Each test should be able to run standalone
   - Use `beforeEach` to reset state
   - Don't rely on test execution order

## Continuous Integration

Tests are run automatically in CI/CD pipelines. Make sure all tests pass before submitting pull requests.

## Troubleshooting

### Tests failing locally but passing in CI
- Clear Jest cache: `npx jest --clearCache`
- Delete `node_modules` and reinstall

### Async timeout errors
- Increase timeout in specific tests:
  ```typescript
  it("long running test", async () => {
    // test code
  }, 10000); // 10 second timeout
  ```

### Mock not working
- Ensure mocks are defined before imports
- Check that mock paths match actual module paths
- Verify mock is cleared in `beforeEach`
