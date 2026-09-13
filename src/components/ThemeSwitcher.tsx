import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CloudSun, Moon, Sun } from "lucide-react";
import { useI18n } from "../useI18n";

type Theme = "dark" | "gray" | "light";

interface ThemeSwitcherProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themeOptions = [
  {
    value: "dark",
    labelKey: "theme.dark",
    icon: Moon,
  },
  {
    value: "gray",
    labelKey: "theme.gray",
    icon: CloudSun,
  },
  {
    value: "light",
    labelKey: "theme.light",
    icon: Sun,
  },
] as const;

export default function ThemeSwitcher({
  theme,
  onThemeChange,
}: ThemeSwitcherProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    themeOptions.find((option) => option.value === theme) ?? themeOptions[0];

  const CurrentIcon = currentOption.icon;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (nextTheme: Theme) => {
    onThemeChange(nextTheme);
    setIsOpen(false);
  };

  return (
    <div className="theme-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="theme-dropdown-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("selectTheme")}
        title={`${t("currentTheme")}: ${t(currentOption.labelKey)}`}
      >
        <CurrentIcon size={19} aria-hidden="true" />

        <span>{t(currentOption.labelKey)}</span>

        <ChevronDown
          size={16}
          className={isOpen ? "is-open" : ""}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="theme-dropdown-menu"
          role="menu"
          aria-label={t("themeSelection")}
        >
          {themeOptions.map((option) => {
            const OptionIcon = option.icon;
            const isActive = option.value === theme;

            return (
              <button
                key={option.value}
                type="button"
                className={`theme-dropdown-option ${
                  isActive ? "is-active" : ""
                }`}
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleSelect(option.value)}
              >
                <OptionIcon size={18} aria-hidden="true" />

                <span>{t(option.labelKey)}</span>

                {isActive && (
                  <Check
                    size={17}
                    className="theme-dropdown-check"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
