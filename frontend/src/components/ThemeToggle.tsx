/**
 * ThemeToggle Component
 *
 * Button to toggle between light and dark themes
 */

import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../shared/hooks/useTheme";

export function ThemeToggle() {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
        >
            {resolvedTheme === "light" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
