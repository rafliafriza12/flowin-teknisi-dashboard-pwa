/**
 * Tests for NotificationPermissionPrompt Component
 *
 * **Validates: Requirements 4.1, 4.5**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotificationPermissionPrompt from "./NotificationPermissionPrompt";

// Mock dependencies
vi.mock("@/libs/pushSubscription", () => ({
  createPushSubscriptionManager: vi.fn(() => ({
    requestPermission: vi.fn(),
    subscribe: vi.fn(),
  })),
}));

vi.mock("@/libs/pushSubscriptionStorage", () => ({
  canAskPermission: vi.fn(),
}));

vi.mock("@/libs/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/atoms/icons/XIcon", () => ({
  default: () => <span>X</span>,
}));

import { createPushSubscriptionManager } from "@/libs/pushSubscription";
import { canAskPermission } from "@/libs/pushSubscriptionStorage";
import { showToast } from "@/libs/toast";

describe("NotificationPermissionPrompt", () => {
  const mockUserId = "user-123";
  const mockOnPermissionGranted = vi.fn();
  const mockOnPermissionDenied = vi.fn();
  const mockOnDismiss = vi.fn();

  // Mock Notification API
  const mockNotification = {
    permission: "default" as NotificationPermission,
    requestPermission: vi.fn(),
  };

  beforeEach(() => {
    // Setup Notification API mock
    Object.defineProperty(window, "Notification", {
      writable: true,
      configurable: true,
      value: mockNotification,
    });

    // Reset mocks
    vi.clearAllMocks();
    mockNotification.permission = "default";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when Notification API is not supported", async () => {
    // Remove Notification API
    Object.defineProperty(window, "Notification", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { container } = render(
      <NotificationPermissionPrompt userId={mockUserId} />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("should not render when permission is already granted", async () => {
    mockNotification.permission = "granted";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    const { container } = render(
      <NotificationPermissionPrompt userId={mockUserId} />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("should not render when permission is denied and within 7-day cooldown", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(false);

    const { container } = render(
      <NotificationPermissionPrompt userId={mockUserId} />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("should render when permission is default and can ask", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    render(<NotificationPermissionPrompt userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("Aktifkan Notifikasi")).toBeInTheDocument();
    });

    expect(screen.getByText("Izinkan Notifikasi")).toBeInTheDocument();
    expect(screen.getByText("Nanti Saja")).toBeInTheDocument();
  });

  it("should call onDismiss when 'Nanti Saja' is clicked", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    render(
      <NotificationPermissionPrompt
        userId={mockUserId}
        onDismiss={mockOnDismiss}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Nanti Saja")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Nanti Saja"));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("should request permission and subscribe when 'Izinkan Notifikasi' is clicked and granted", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    const mockManager = {
      requestPermission: vi.fn().mockResolvedValue("granted"),
      subscribe: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(createPushSubscriptionManager).mockReturnValue(
      mockManager as any,
    );

    render(
      <NotificationPermissionPrompt
        userId={mockUserId}
        onPermissionGranted={mockOnPermissionGranted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Izinkan Notifikasi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Izinkan Notifikasi"));

    await waitFor(() => {
      expect(mockManager.requestPermission).toHaveBeenCalledTimes(1);
      expect(mockManager.subscribe).toHaveBeenCalledTimes(1);
      expect(showToast.success).toHaveBeenCalledWith("Notifikasi diaktifkan");
      expect(mockOnPermissionGranted).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle permission denial gracefully", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    const mockManager = {
      requestPermission: vi.fn().mockResolvedValue("denied"),
      subscribe: vi.fn(),
    };
    vi.mocked(createPushSubscriptionManager).mockReturnValue(
      mockManager as any,
    );

    render(
      <NotificationPermissionPrompt
        userId={mockUserId}
        onPermissionDenied={mockOnPermissionDenied}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Izinkan Notifikasi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Izinkan Notifikasi"));

    await waitFor(() => {
      expect(mockManager.requestPermission).toHaveBeenCalledTimes(1);
      expect(mockManager.subscribe).not.toHaveBeenCalled();
      expect(showToast.info).toHaveBeenCalled();
      expect(mockOnPermissionDenied).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle subscription error gracefully", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    const mockManager = {
      requestPermission: vi.fn().mockResolvedValue("granted"),
      subscribe: vi.fn().mockRejectedValue(new Error("Subscription failed")),
    };
    vi.mocked(createPushSubscriptionManager).mockReturnValue(
      mockManager as any,
    );

    render(
      <NotificationPermissionPrompt
        userId={mockUserId}
        onPermissionGranted={mockOnPermissionGranted}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Izinkan Notifikasi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Izinkan Notifikasi"));

    await waitFor(() => {
      expect(mockManager.requestPermission).toHaveBeenCalledTimes(1);
      expect(mockManager.subscribe).toHaveBeenCalledTimes(1);
      // Should still call onPermissionGranted even if subscription fails
      expect(mockOnPermissionGranted).toHaveBeenCalledTimes(1);
    });
  });

  it("should disable buttons while requesting permission", async () => {
    mockNotification.permission = "default";
    vi.mocked(canAskPermission).mockResolvedValue(true);

    const mockManager = {
      requestPermission: vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve("granted"), 100)),
        ),
      subscribe: vi.fn().mockResolvedValue({}),
    };
    vi.mocked(createPushSubscriptionManager).mockReturnValue(
      mockManager as any,
    );

    render(<NotificationPermissionPrompt userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText("Izinkan Notifikasi")).toBeInTheDocument();
    });

    const allowButton = screen.getByText("Izinkan Notifikasi");
    const notNowButton = screen.getByText("Nanti Saja");

    fireEvent.click(allowButton);

    // Buttons should be disabled while processing
    expect(allowButton).toBeDisabled();
    expect(notNowButton).toBeDisabled();

    await waitFor(() => {
      expect(mockManager.requestPermission).toHaveBeenCalledTimes(1);
    });
  });
});
