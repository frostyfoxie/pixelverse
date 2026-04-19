import { useState, useEffect, useCallback } from "react";

export function useSlideshow(totalSections: number) {
    const [activeSection, setActiveSection] = useState(0);

    const handleWheel = useCallback((e: WheelEvent) => {
        if (e.deltaY > 50) {
            setActiveSection(p => Math.min(p + 1, totalSections - 1));
        } else if (e.deltaY < -50) {
            setActiveSection(p => Math.max(p - 1, 0));
        }
    }, [totalSections]);

    useEffect(() => {
        let timeout: any;
        const onWheel = (e: WheelEvent) => {
            if (timeout) return;
            handleWheel(e);
            timeout = setTimeout(() => {
                timeout = null;
            }, 800);
        };

        let touchStartY = 0;
        const onTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };

        const onTouchEnd = (e: TouchEvent) => {
            const touchEndY = e.changedTouches[0].clientY;
            if (touchStartY - touchEndY > 50) {
                setActiveSection(p => Math.min(p + 1, totalSections - 1));
            } else if (touchStartY - touchEndY < -50) {
                setActiveSection(p => Math.max(p - 1, 0));
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                setActiveSection(p => Math.min(p + 1, totalSections - 1));
            } else if (e.key === "ArrowUp") {
                setActiveSection(p => Math.max(p - 1, 0));
            }
        };

        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
