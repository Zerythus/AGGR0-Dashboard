import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AccessibilitySettings {
  fontSizeLevel: number; // 2-4, where 3 is default
  highContrast: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSizeLevel: (level: number) => void;
  setHighContrast: (enabled: boolean) => void;
  resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSizeLevel: 3,
  highContrast: false,
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount and inject global styles
  useEffect(() => {
    const saved = localStorage.getItem("accessibilitySettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applyAccessibilitySettings(parsed);
      } catch (e) {
        console.error("Failed to parse accessibility settings:", e);
      }
    } else {
      applyAccessibilitySettings(DEFAULT_SETTINGS);
    }

    // Inject global accessibility styles
    injectAccessibilityStyles();
  }, []);

  const setFontSizeLevel = (level: number) => {
    const newSettings = { ...settings, fontSizeLevel: Math.max(2, Math.min(4, level)) };
    setSettings(newSettings);
    localStorage.setItem("accessibilitySettings", JSON.stringify(newSettings));
    applyAccessibilitySettings(newSettings);
  };

  const setHighContrast = (enabled: boolean) => {
    const newSettings = { ...settings, highContrast: enabled };
    setSettings(newSettings);
    localStorage.setItem("accessibilitySettings", JSON.stringify(newSettings));
    applyAccessibilitySettings(newSettings);
  };

  const resetAccessibility = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem("accessibilitySettings", JSON.stringify(DEFAULT_SETTINGS));
    applyAccessibilitySettings(DEFAULT_SETTINGS);
  };

  const value: AccessibilityContextType = {
    settings,
    setFontSizeLevel,
    setHighContrast,
    resetAccessibility,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}

function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // Calculate font size multiplier
  // Level 3 is default (1x), level 2 is 0.9x, level 4 is 1.1x
  const fontMultipliers: { [key: number]: number } = {
    2: 0.9,
    3: 1,
    4: 1.1,
  };

  const multiplier = fontMultipliers[settings.fontSizeLevel] || 1;

  // Apply font size scale using CSS custom property
  root.style.setProperty("--font-size-multiplier", String(multiplier));

  // Apply high contrast mode
  if (settings.highContrast) {
    root.classList.add("high-contrast");
    // Set high contrast CSS variables
    root.style.setProperty("--text-color", "#FFFFFF");
    root.style.setProperty("--primary-color", "#FFD700");
    root.style.setProperty("--background-color", "#000000");
    root.style.setProperty("--background-color2", "#1a1a1a");
  } else {
    root.classList.remove("high-contrast");
    // Reset to original colors
    root.style.setProperty("--text-color", "#E5E7EB");
    root.style.setProperty("--primary-color", "#29BDFF");
    root.style.setProperty("--background-color", "#182134");
    root.style.setProperty("--background-color2", "#192B45");
  }

  // Apply font size scaling to inline styles
  // This ensures elements with style={{ fontSize: "..." }} are also affected
  applyInlineStyleScaling(multiplier);
}

function applyInlineStyleScaling(multiplier: number) {
  // Get all elements with inline styles
  const allElements = document.querySelectorAll("[style*='font-size'], [style*='fontSize']");

  allElements.forEach((element) => {
    const el = element as HTMLElement;
    const styleAttr = el.getAttribute("style");

    if (!styleAttr) return;

    // Extract original font-size if it has a data attribute storing it
    let originalFontSize = el.getAttribute("data-original-font-size");

    // If no original stored, extract from current style or calculate from element
    if (!originalFontSize) {
      const styleMatch = styleAttr.match(/font-size:\s*([^;]+)/);
      if (styleMatch) {
        originalFontSize = styleMatch[1].trim();
        el.setAttribute("data-original-font-size", originalFontSize);
      }
    }

    if (originalFontSize) {
      // Parse the font size value
      const value = parseFloat(originalFontSize);
      const unit = originalFontSize.replace(/[0-9.]/g, "");

      // Apply the multiplier
      const newSize = value * multiplier;

      // Update the style
      const newStyle = styleAttr.replace(
        /font-size:\s*[^;]+/,
        `font-size: ${newSize}${unit}`
      );
      el.setAttribute("style", newStyle);
    }
  });
}

function injectAccessibilityStyles() {
  // Check if accessibility styles already injected
  if (document.getElementById("accessibility-global-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "accessibility-global-styles";
  style.textContent = `
    /* Ensure all font-related elements respect accessibility settings */
    * {
      /* Text-specific elements */
      transition: font-size 0.3s ease !important;
    }
    
    /* Override Recharts and other library text sizes */
    tspan, text {
      font-size: calc(var(--font-size-multiplier, 1) * 1em) !important;
    }
    
    /* SVG text elements */
    svg text {
      font-size: calc(var(--font-size-multiplier, 1) * 1em) !important;
    }
  `;
  document.head.appendChild(style);
}
