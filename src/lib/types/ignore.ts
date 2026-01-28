//TODO Recommendation: Map any match in that list to "Desktop" or "Idle". Do not try to resolve it further.

export const IGNORE_LIST = new Set<string>([
    // KDE / Plasma
    "kwin_wayland",
    "kwin_x11",
    "plasmashell",
    "krunner",

    // GNOME
    "gnome-shell",
    "gnome-session-binary",

    // X11 / Generic
    "Xorg",
    "Xwayland",

    // Windows (just in case)
    "explorer.exe",
    "dwm.exe",
    "SearchHost.exe"
]);

export function isSystemNoise(potentialName: string): boolean {
    return IGNORE_LIST.has(potentialName);
}