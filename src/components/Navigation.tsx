import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";

const NAV_ITEMS = [
    { label: "Cosmos", id: 0 },
    { label: "Big Bang", id: 1 },
    { label: "Forge", id: 2 },
    { label: "Earth", id: 3 },
    { label: "Life", id: 4 },
    { label: "Dinosaurs", id: 5 },
    { label: "Impact", id: 6 },
    { label: "Mind", id: 7 },
    { label: "You", id: 8 },
    { label: "Contact", id: 9 },
];

export default function Navigation({ activeSection, setActiveSection }: { activeSection: number, setActiveSection: (id: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    // Close when tapping outside the menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    return (
        <div 
            ref={navRef}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onClick={() => { if (!isOpen) setIsOpen(true); }}
            className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 py-8 pl-4 pr-6 sm:pr-8 transition-all duration-300 rounded-r-2xl cursor-pointer md:cursor-auto ${
                isOpen 
                    ? "translate-x-0 bg-black/40 backdrop-blur-md shadow-[4px_0_20px_rgba(0,0,0,0.5)]" 
                    : "-translate-x-[calc(100%-20px)]"
            }`}
        >
            {/* Minimal pill indicator when closed - visible on the screen edge */}
            <div className={`absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full transition-opacity duration-300 ${
                isOpen ? 'opacity-0' : 'opacity-100'
            } ${activeSection === 9 ? 'bg-black/30' : 'bg-white/30'}`} />
            
            {NAV_ITEMS.map((item) => (
                <div 
                    key={item.id} 
                    onClick={(e) => {
                        if (!isOpen) return; // Prevent navigation on the initial tap that opens the menu via touch
                        e.stopPropagation();
                        setActiveSection(item.id);
                        setIsOpen(false);
                    }}
                    className="flex items-center justify-start gap-4 cursor-pointer"
                >
                    <div className="relative w-1.5 h-1.5 flex items-center justify-center shrink-0">
                        <div className={`absolute w-full h-full rounded-full transition-all duration-300 ${
                            activeSection === item.id 
                                ? "bg-[#00d2ff] scale-150 shadow-[0_0_8px_#00d2ff]" 
                                : activeSection === 9 && !isOpen ? "bg-black/40" : "bg-white/40"
                        }`} />
                        {activeSection === item.id && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="absolute w-3 h-3 border border-[#00d2ff] rounded-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </div>
                    <span 
                        className={`text-[0.65rem] sm:text-xs uppercase tracking-[2px] font-medium transition-all duration-300 whitespace-nowrap ${
                            isOpen 
                                ? activeSection === item.id 
                                    ? "text-[#00d2ff] opacity-100 translate-x-0" 
                                    : "text-white/60 opacity-100 translate-x-0 hover:text-white"
                                : "opacity-0 -translate-x-4 pointer-events-none"
                        }`}
                    >
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
