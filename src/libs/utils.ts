// Utility function untuk class names
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Delay function untuk testing
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Format currency
export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Format date to readable string
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "-";

  try {
    let date: Date;
    if (dateString instanceof Date) {
      date = dateString;
    } else if (/^\d+$/.test(dateString)) {
      // Numeric string → treat as Unix timestamp (ms)
      date = new Date(Number(dateString));
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Invalid Date";
  }
}

// Check if menu is active based on current pathname
export function isActiveMenu(menuUrl: string, currentPath: string): boolean {
  // Exact match untuk root/dashboard
  if (menuUrl === "/" && currentPath === "/") {
    return true;
  }

  // Jangan match root untuk path lain
  if (menuUrl === "/" && currentPath !== "/") {
    return false;
  }

  // Check if current path starts with menu URL
  // Contoh: menuUrl="/reports" akan match dengan "/reports/annual-report"
  return currentPath.startsWith(menuUrl);
}

export const smoothScrolltoSection = (elementId: string) => {
  if (elementId.startsWith("#")) {
    elementId = elementId.substring(1);
  }
  const element = document.getElementById(elementId);
  console.log("Scrolling to element:", elementId, element);

  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - 110;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};
