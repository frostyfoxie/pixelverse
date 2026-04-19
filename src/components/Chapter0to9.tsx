import { useEffect, useRef, useState } from 'react';

export function Chapter0({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();

    useEffect(() => {
        const canvas = canvasRef.current;
        const overlay = overlayRef.current;
        if (!canvas || !overlay) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let width = 0, height = 0;
        let particles: any[] = [];
        const PARTICLE_COUNT = 5000; 
        const TITLE = "The Cosmos";
        let initTimeout: any, overlayTimeout: any;
        let mouse = { x: -1000, y: -1000, radius: 100 };
        let textFormed = false;
        const colors = ['#ff00ff', '#00ffff', '#7000ff', '#ff0055', '#ffffff'];
        let animationFrameId: number;

        class Particle {
            x!: number; y!: number; homeX!: number; homeY!: number;
            vx!: number; vy!: number; size!: number;
            baseColor!: string; color!: string; isText!: boolean; alpha!: number;
            constructor() { this.init(); }
            init() {
                this.x = Math.random() * window.innerWidth;
                this.y = Math.random() * window.innerHeight;
                this.homeX = this.x; this.homeY = this.y;
                this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 1.5 + 0.5;
                this.baseColor = colors[Math.floor(Math.random() * colors.length)];
                this.color = this.baseColor; this.isText = false;
                this.alpha = Math.random() * 0.5 + 0.2;
            }
            update() {
                let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < mouse.radius) {
                    let force = (mouse.radius - dist) / mouse.radius;
                    let angle = Math.atan2(dy, dx);
                    this.vx -= Math.cos(angle) * force * 0.6; this.vy -= Math.sin(angle) * force * 0.6;
                    this.alpha = 1.0; 
                } else { this.alpha += (0.6 - this.alpha) * 0.02; }
                if (this.isText) {
                    this.x += (this.homeX - this.x) * 0.06 + this.vx; this.y += (this.homeY - this.y) * 0.06 + this.vy;
                    this.vx *= 0.9; this.vy *= 0.9;
                } else {
                    this.x += this.vx; this.y += this.vy;
                    if (this.x < 0) this.x = width; if (this.x > width) this.x = 0;
                    if (this.y < 0) this.y = height; if (this.y > height) this.y = 0;
                }
            }
            draw() {
                ctx!.fillStyle = this.color;
                
                if (this.isText) {
                    // Optimized fake glow: draw a slightly larger transparent rect instead of expensive shadowBlur
                    ctx!.globalAlpha = this.alpha * 0.25;
                    ctx!.fillRect(this.x - 2, this.y - 2, this.size + 4, this.size + 4);
                }
                
                ctx!.globalAlpha = this.alpha;
                ctx!.fillRect(this.x, this.y, this.size, this.size);
            }
        }

        // Wait for fonts to load before sampling
        const loadFontsAndInit = () => {
            document.fonts.ready.then(() => {
                init();
            });
        };

        function sampleTextPoints() {
            const tempCanvas = document.createElement('canvas'); const tempCtx = tempCanvas.getContext('2d')!;
            tempCanvas.width = width; tempCanvas.height = height;
            tempCtx.fillStyle = "#000"; let fontSize = Math.min(width * 0.15, 160);
            tempCtx.font = `700 ${fontSize}px 'Cal Sans', sans-serif`; tempCtx.textAlign = "center"; tempCtx.textBaseline = "middle";
            tempCtx.fillText(TITLE, width / 2, height / 2);
            const imageData = tempCtx.getImageData(0, 0, width, height).data;
            const points = []; const step = width < 600 ? 3 : 4; 
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const index = (y * width + x) * 4 + 3;
                    if (imageData[index] > 128) points.push({ x, y });
                }
            }
            return points;
        }

        function init() {
            clearTimeout(initTimeout); clearTimeout(overlayTimeout);
            overlay!.classList.remove('visible'); textFormed = false; mouse.x = -1000; mouse.y = -1000;
            width = window.innerWidth; height = window.innerHeight;
            canvas!.width = width; canvas!.height = height;
            particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

            initTimeout = setTimeout(() => {
                const points = sampleTextPoints();
                for (let i = 0; i < points.length && i < particles.length; i++) {
                    particles[i].homeX = points[i].x; particles[i].homeY = points[i].y;
                    particles[i].isText = true;
                    particles[i].vx = (Math.random() - 0.5) * 10; particles[i].vy = (Math.random() - 0.5) * 10;
                }
                textFormed = true;
                overlayTimeout = setTimeout(() => overlay!.classList.add('visible'), 2000);
            }, 1200);
        }

        function animate() {
            if (activeRef.current) {
                ctx!.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx!.fillRect(0, 0, width, height);
                for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); }
            }
            animationFrameId = requestAnimationFrame(animate);
        }

        const handleInput = (e: any) => {
            const rect = canvas!.getBoundingClientRect();
            mouse.x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            mouse.y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        };

        window.addEventListener('mousemove', handleInput);
        window.addEventListener('touchstart', (e) => { handleInput(e); mouse.radius = 150; });
        window.addEventListener('touchmove', handleInput);
        window.addEventListener('touchend', () => { mouse.x = -1000; mouse.y = -1000; });
        window.addEventListener('resize', init);

        resetRef.current = () => loadFontsAndInit();

        loadFontsAndInit();
        animate();

        return () => {
            window.removeEventListener('mousemove', handleInput);
            window.removeEventListener('touchstart', handleInput);
            window.removeEventListener('touchmove', handleInput);
            window.removeEventListener('resize', init);
            clearTimeout(initTimeout); clearTimeout(overlayTimeout);
            cancelAnimationFrame(animationFrameId);
        }
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-0">
            <div id="overlay-0" ref={overlayRef}>
                <div className="scroll-hint">scroll to explore</div>
            </div>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

export function Chapter1to6({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0, height = 0; let pixels: any[] = []; const spacing = 3; 
        let gameFrame = 0; let currentState = 0; let stateTimer = 0;
        let stickmanX = 0; let stickmanY = 0; let cameraY = 0;
        const walkSpeed = 2.2; let bangScale = 0;
        let animationFrameId: number;

        function jumpToState(stateNum: number) {
            currentState = stateNum; stateTimer = 0;
            if (stateNum < 7) { cameraY = 0; stickmanX = width/2; } else { cameraY = height + 300; } 
            if (stateNum === 9) bangScale = 0;
            setUiState(-1);
        }

        class Pixel {
            x: number; y: number; brightness: number; size: number; color: any;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.size = 1.1; this.color = {r: 255, g: 255, b: 255}; }
            draw() {
                if (this.brightness < 0.01) return;
                ctx!.globalAlpha = this.brightness; ctx!.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
                ctx!.beginPath(); ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx!.fill();
                if (this.brightness > 0.5) { ctx!.globalAlpha = this.brightness * 0.2; ctx!.beginPath(); ctx!.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2); ctx!.fill(); }
            }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight;
            stickmanY = height * 0.7; stickmanX = width / 2; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Pixel(x, y)); }
        }

        function getLineDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
            const l2 = (x1-x2)**2 + (y1-y2)**2;
            if (l2 === 0) return Math.sqrt((px-x1)**2 + (py-y1)**2);
            let t = Math.max(0, Math.min(1, ((px-x1)*(x2-x1) + (py-y1)*(y2-y1)) / l2));
            return Math.sqrt((px-(x1+t*(x2-x1)))**2 + (py-(y1+t*(y2-y1)))**2);
        }

        function getPixelState(px: number, py: number) {
            if (currentState <= 6) {
                const drawY = py + cameraY; const headRadius = 18; const bodyHeight = 15;
                const isWalking = (currentState === 3 || currentState === 4);
                const bounce = isWalking ? Math.abs(Math.sin(gameFrame * 0.2)) * 6 : Math.sin(gameFrame * 0.05) * 2;
                const currentStickY = stickmanY - bounce; const headY = currentStickY - bodyHeight - headRadius;
                if (drawY < -50 || drawY > height + 50) return { b: 0 };
                const dx = px - stickmanX; const dy = drawY - headY; const headDist = Math.sqrt(dx*dx + dy*dy);
                if (headDist < headRadius) return { b: Math.min(1, (headRadius - headDist) * 1.5) };
                const bodyDist = getLineDist(px, drawY, stickmanX, headY + headRadius, stickmanX, currentStickY);
                if (bodyDist < 3) return { b: 1 - (bodyDist/3) };
                let walkPhase = Math.sin(gameFrame * 0.2); let legX = isWalking ? walkPhase * 12 : 6;
                const dL = getLineDist(px, drawY, stickmanX, currentStickY, stickmanX - legX, currentStickY + 25);
                const dR = getLineDist(px, drawY, stickmanX, currentStickY, stickmanX + legX, currentStickY + 25);
                if (dL < 2.5) return { b: 1 - (dL/2.5) }; if (dR < 2.5) return { b: 1 - (dR/2.5) };
                const shoulderY = headY + headRadius + 4;
                if (currentState === 5) {
                    let wave = Math.sin(gameFrame * 0.3) * 15;
                    const aL = getLineDist(px, drawY, stickmanX, shoulderY, stickmanX - 18, shoulderY - 15 + wave);
                    const aR = getLineDist(px, drawY, stickmanX, shoulderY, stickmanX + 18, shoulderY - 15 - wave);
                    if (aL < 2.5) return { b: 1 - (aL/2.5) }; if (aR < 2.5) return { b: 1 - (aR/2.5) };
                } else {
                    let armSwing = isWalking ? -walkPhase * 12 : 4;
                    const aL = getLineDist(px, drawY, stickmanX, shoulderY, stickmanX - 12 - armSwing, shoulderY + 12);
                    const aR = getLineDist(px, drawY, stickmanX, shoulderY, stickmanX + 12 + armSwing, shoulderY + 12);
                    if (aL < 2.5) return { b: 1 - (aL/2.5) }; if (aR < 2.5) return { b: 1 - (aR/2.5) };
                }
            }
            if (currentState >= 7) {
                const cx = width / 2; const cy = height / 2;
                const dx = px - cx; const dy = py - cy; const dist = Math.sqrt(dx*dx + dy*dy); const angle = Math.atan2(dy, dx);
                let time = gameFrame * 0.08;
                if (currentState === 8) { 
                    const sRadius = 4 + Math.sin(gameFrame * 0.15);
                    if (dist < sRadius) return { b: 1, c: {r:255, g:255, b:255} };
                    if (dist < sRadius + 10) return { b: 1 - (dist-sRadius)/10, c: {r:255, g:255, b:255} };
                }
                if (currentState === 9) { 
                    let ripple1 = Math.sin(dist * 0.05 - time); let ripple2 = Math.sin(dx * 0.02 + time) * Math.cos(dy * 0.02 + time);
                    let interference = ripple1 * ripple2;
                    if (dist < bangScale && dist > bangScale - 60) return { b: 1 - Math.abs((dist - (bangScale-30))/30), c: {r: 255, g: 240, b: 200} };
                    if (dist < bangScale && interference > 0.3) return { b: 0.4 * interference, c: {r: 255, g: 220, b: 180} };
                }
                if (currentState === 10) { 
                    let noise = Math.sin(px * 0.04 + gameFrame * 0.08) * Math.cos(py * 0.04 - gameFrame * 0.05);
                    if (Math.random() > 0.82 + (noise * 0.12)) return { b: Math.random(), c: {r: 255, g: 220 + Math.random()*35, b: 150} };
                }
                if (currentState === 11) { 
                    let clusterSize = 35; let gridX = Math.floor(px / clusterSize); let gridY = Math.floor(py / clusterSize);
                    let clusterCenter = { x: gridX * clusterSize + clusterSize/2 + Math.sin(gridY + gameFrame * 0.02) * 12, y: gridY * clusterSize + clusterSize/2 + Math.cos(gridX + gameFrame * 0.02) * 12 };
                    let distToCluster = Math.sqrt((px - clusterCenter.x)**2 + (py - clusterCenter.y)**2);
                    if (distToCluster < 4) return { b: 1 - distToCluster/4, c: {r: 200, g: 230, b: 255} };
                    else if (distToCluster < 10 && Math.random() > 0.85) return { b: 0.35, c: {r: 150, g: 180, b: 255} };
                }
                if (currentState === 12) { 
                    let atomGrid = 70; let nx = Math.floor(px / atomGrid) * atomGrid + atomGrid/2; let ny = Math.floor(py / atomGrid) * atomGrid + atomGrid/2;
                    let distToNucleus = Math.sqrt((px - nx)**2 + (py - ny)**2); let captureFade = Math.min(1, stateTimer / 200);
                    let bgNoise = Math.random() > 0.94 ? 0.35 * (1 - captureFade) : 0;
                    if (distToNucleus < 3.5) return { b: 1, c: {r: 255, g: 120, b: 120} };
                    else if (distToNucleus > 15 && distToNucleus < 22) {
                        let atomAngle = Math.atan2(py - ny, px - nx); let electronDot = Math.sin(atomAngle * 1 - gameFrame * 0.18);
                        if (electronDot > 0.85) return { b: captureFade, c: {r: 120, g: 210, b: 255} };
                        else if (Math.random() > 0.92) return { b: 0.4 * captureFade, c: {r: 100, g: 160, b: 255} };
                    }
                    if (bgNoise > 0) return { b: bgNoise, c: {r: 255, g: 255, b: 255} };
                }
                if (currentState === 13) { 
                    let atomGrid = 70; let nx = Math.floor(px / atomGrid) * atomGrid + atomGrid/2; let ny = Math.floor(py / atomGrid) * atomGrid + atomGrid/2;
                    let distToNucleus = Math.sqrt((px - nx)**2 + (py - ny)**2); let dimming = Math.max(0, 1 - stateTimer / 270);
                    if (distToNucleus < 3.5) return { b: dimming, c: {r: 255, g: 120, b: 120} };
                    if (Math.random() > 0.97) return { b: 0.15 * dimming }; 
                }
                if (currentState === 14) { 
                    let gridCellSize = 70; let gridX = Math.floor(px / gridCellSize); let gridY = Math.floor(py / gridCellSize);
                    let seed = Math.sin(gridX * 13.5) * Math.cos(gridY * 37.2); let density = (seed + 1) / 2;
                    let gravityTime = Math.min(1, stateTimer / 530); let visibilityThreshold = 0.94 - (gravityTime * 0.45);
                    if (density > visibilityThreshold) return { b: (density - visibilityThreshold) * 3.5, c: {r: 160, g: 190, b: 255} };
                }
                if (currentState === 15) { 
                    let pressure = Math.min(1, stateTimer / 250); let pull = Math.max(0, 1 - (dist / 450));
                    if (dist < 280 - pressure * 180) return { b: (pull * pressure) + (Math.random() * 0.25), c: {r: 210, g: 230, b: 255} };
                    if (Math.random() > 0.97) return { b: 0.15, c: {r: 120, g: 120, b: 180} };
                }
                if (currentState === 16) { 
                    if (stateTimer < 60) return { b: 1 - (stateTimer / 60) + (Math.random() * 0.6), c: {r: 255, g: 255, b: 255} };
                    let starTime = gameFrame * 0.1; let starRadius = 45 + Math.sin(starTime * 2.2) * 3; 
                    if (dist < starRadius) return { b: 1, c: {r: 255, g: 255, b: 230} }; 
                    let rays = Math.sin(angle * 6 - starTime * 0.25) + Math.cos(angle * 10 + starTime * 0.15);
                    if (rays > 1.1) return { b: Math.max(0, 1 - dist / 550) * 0.7, c: {r: 255, g: 245, b: 210} };
                    if (Math.random() > 0.94) return { b: 0.18 * (1-dist/850), c: {r: 160, g: 210, b: 255} };
                }
            }
            return { b: 0 };
        }

        function update() {
            gameFrame++; stateTimer++; const NARRATIVE_DURATION = 270;
            switch(currentState) {
                case 0: if(stateTimer > 50) { currentState=1; stateTimer=0; } break;
                case 1: if(stateTimer > 30) { currentState=2; stateTimer=0; } break;
                case 2: setUiState(0); if(stateTimer > NARRATIVE_DURATION) { currentState=3; stateTimer=0; } break;
                case 3: stickmanX += walkSpeed; if(stateTimer > 120) { currentState=4; stateTimer=0; } break;
                case 4: stickmanX -= walkSpeed; if(stickmanX <= width/2) { stickmanX=width/2; currentState=5; stateTimer=0; } break;
                case 5: setUiState(1); if(stateTimer > NARRATIVE_DURATION) { currentState=6; stateTimer=0; } break;
                case 6: setUiState(-1); cameraY += 7; if(cameraY > height + 200) { currentState = 7; stateTimer = 0; } break;
                case 7: 
                    if (stateTimer === 10) setUiState(2); if (stateTimer === NARRATIVE_DURATION) setUiState(3);
                    if (stateTimer === NARRATIVE_DURATION * 2) setUiState(4); if (stateTimer > NARRATIVE_DURATION * 3) { currentState = 8; stateTimer = 0; } break;
                case 8: if (stateTimer > 50) { currentState = 9; stateTimer = 0; bangScale = 0; } break;
                case 9: setUiState(5); bangScale += 14; if (bangScale > width * 1.6) { currentState = 10; stateTimer = 0; } break;
                case 10: 
                    if (stateTimer === 10) setUiState(6); if (stateTimer === NARRATIVE_DURATION) setUiState(7);
                    if (stateTimer > NARRATIVE_DURATION * 2) { currentState = 11; stateTimer = 0; } break;
                case 11: 
                    if (stateTimer === 10) setUiState(8); if (stateTimer === NARRATIVE_DURATION) setUiState(9);
                    if (stateTimer > NARRATIVE_DURATION * 2) { currentState = 12; stateTimer = 0; } break;
                case 12: 
                    if (stateTimer === 10) setUiState(10); if (stateTimer === NARRATIVE_DURATION) setUiState(11);
                    if (stateTimer > NARRATIVE_DURATION * 2) { currentState = 13; stateTimer = 0; } break;
                case 13: if (stateTimer === 10) setUiState(12); if (stateTimer > NARRATIVE_DURATION) { currentState = 14; stateTimer = 0; } break;
                case 14: if (stateTimer === 10) setUiState(13); if (stateTimer > NARRATIVE_DURATION) { currentState = 15; stateTimer = 0; } break;
                case 15: if (stateTimer === 10) setUiState(14); if (stateTimer > NARRATIVE_DURATION) { currentState = 16; stateTimer = 0; } break;
                case 16: if (stateTimer === 10) setUiState(15);
                    if (stateTimer > NARRATIVE_DURATION + 150) { setUiState(-1); currentState = 0; stickmanX = width/2; cameraY = 0; stateTimer = 0; } break;
            }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "black"; ctx!.fillRect(0, 0, width, height); update();
                for (let i = 0; i < pixels.length; i++) {
                    const p = pixels[i]; const res = getPixelState(p.x, p.y);
                    p.brightness = res.b || 0; p.color = res.c || {r: 255, g: 255, b: 255};
                    p.draw();
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        
        resetRef.current = () => jumpToState(0);
        
        initGrid(); 
        draw();

        return () => {
            window.removeEventListener('resize', initGrid);
            cancelAnimationFrame(animationFrameId);
        }
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-1-6">
            <div id="tc-1-6" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}>Ever wondered how we all came to exist?</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Don't worry I got ya, lemme tell you<br/>from the very beginning hahaha!</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}>No space. No time. No laws. No direction.<br/>Not darkness—because darkness needs space to exist.</div>
                <div className={`shared-text-element ${uiState === 3 ? 'active' : ''}`}>There was no “before.”<br/>Because time itself hadn’t begun.</div>
                <div className={`shared-text-element ${uiState === 4 ? 'active' : ''}`}>And then—<br/>something changed.</div>
                <div className={`shared-text-element ${uiState === 5 ? 'active' : ''}`}><b>The Big Bang</b><br/>Not an explosion in space, but the appearance of space itself.</div>
                <div className={`shared-text-element ${uiState === 6 ? 'active' : ''}`}><b>Inflation</b><br/>A violent stretching of reality.</div>
                <div className={`shared-text-element ${uiState === 7 ? 'active' : ''}`}>Energy filled everything.<br/>Temperature beyond comprehension.</div>
                <div className={`shared-text-element ${uiState === 8 ? 'active' : ''}`}><b>The First Seconds</b><br/>As it expanded and cooled, tiny fluctuations became everything.</div>
                <div className={`shared-text-element ${uiState === 9 ? 'active' : ''}`}>Particles blinked into existence and vanished.<br/>Then some stayed, forming protons and neutrons.</div>
                <div className={`shared-text-element ${uiState === 10 ? 'active' : ''}`}><b>The First Atoms</b><br/>The universe cooled enough for protons to capture electrons.</div>
                <div className={`shared-text-element ${uiState === 11 ? 'active' : ''}`}>The first atoms formed: Hydrogen and Helium.<br/>Simple, light, and everywhere.</div>
                <div className={`shared-text-element ${uiState === 12 ? 'active' : ''}`}>And then—<br/>nothing much happened… for millions of years.</div>
                <div className={`shared-text-element ${uiState === 13 ? 'active' : ''}`}><b>The Long Darkness</b><br/>No stars or galaxies, just a vast, expanding fog of atoms.</div>
                <div className={`shared-text-element ${uiState === 14 ? 'active' : ''}`}>Gravity was at work—quietly, constantly—<br/>pulling matter into clumps as structure began to emerge.</div>
                <div className={`shared-text-element ${uiState === 15 ? 'active' : ''}`}><b>The First Stars</b><br/>Gravity pulled regions denser, causing clouds to collapse.</div>
                <div className={`shared-text-element ${uiState === 16 ? 'active' : ''}`}>Then, fusion ignited. The first stars were born,<br/>and light finally entered the universe.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

export function Chapter7to9({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0, height = 0; let pixels: any[] = []; const spacing = 6; 
        let gameFrame = 0; let currentState = 0; let stateTimer = 0; let shake = 0;
        let animationFrameId: number;

        class Pixel {
            x: number; y: number; brightness: number; size: number; color: any;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.size = 2.2; this.color = {r: 255, g: 255, b: 255}; }
            draw() {
                if (this.brightness < 0.01) return;
                let rx = this.x; let ry = this.y;
                if (shake > 0) { rx += (Math.random() - 0.5) * shake; ry += (Math.random() - 0.5) * shake; }
                ctx!.globalAlpha = Math.min(this.brightness, 1); ctx!.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
                ctx!.beginPath(); ctx!.arc(rx, ry, this.size, 0, Math.PI * 2); ctx!.fill();
                if (this.brightness > 0.8) { ctx!.globalAlpha = this.brightness * 0.2; ctx!.beginPath(); ctx!.arc(rx, ry, this.size * 2, 0, Math.PI * 2); ctx!.fill(); }
            }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Pixel(x, y)); }
        }

        const fastNoise = (x: number, y: number, t: number) => Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t * 0.7);

        function getPixelState(px: number, py: number) {
            const cx = width / 2; const cy = height / 2;
            const dx = px - cx; const dy = py - cy; const dist = Math.sqrt(dx*dx + dy*dy); const angle = Math.atan2(dy, dx);
            if (currentState === 0) {
                let time = gameFrame * 0.03; let intensity = 0; let color = {r: 255, g: 255, b: 255};
                const atoms =[ {x: Math.cos(time)*85, y: Math.sin(time*0.8)*40, r: 16, c: {r:255, g:100, b:100}}, {x: Math.cos(time+Math.PI)*85, y: Math.sin(time*0.8+Math.PI)*40, r: 16, c: {r:100, g:180, b:255}} ];
                for (let i = 0; i < atoms.length; i++) {
                    const a = atoms[i]; let d = Math.sqrt((px-(cx+a.x))**2 + (py-(cy+a.y))**2);
                    if (d < a.r) { intensity = Math.min(1.2, (a.r - d) * 0.8); color = a.c; }
                    let eAngle = time * 4.5; let ex = a.x + Math.cos(eAngle) * 35; let ey = a.y + Math.sin(eAngle * 1.4) * 22;
                    let ed = Math.sqrt((px - (cx + ex))**2 + (py - (cy + ey))**2);
                    if (ed < 6) { intensity = 1; color = {r:255, g:255, b:255}; }
                }
                let fusionDist = Math.abs(atoms[0].x - atoms[1].x);
                if (fusionDist < 45) { let g = (1 - fusionDist/45) * (1 - dist/125); if (g > 0) { intensity = Math.max(intensity, g * 3); color = {r:255, g:255, b:180}; } }
                if (intensity > 0) return { b: intensity, c: color }; return { b: (fastNoise(px, py, time*0.1)+1)*0.08, c: {r:40, g:45, b:90} };
            }
            if (currentState === 1) {
                let colP = 150, bngP = 180;
                if (stateTimer < colP) {
                    let t = stateTimer / colP; let r = 110 * (1 - t*0.2) * (1 + Math.sin(stateTimer*0.2)*0.05);
                    if (dist < r) return { b: 1.1 + fastNoise(px, py, gameFrame*0.1), c: {r: 255, g: 70+t*80, b: 40} };
                } else if (stateTimer < bngP) {
                    let t = (stateTimer - colP) / (bngP - colP); let r = 100 * Math.pow(1 - t, 4);
                    if (dist < r + 8) return { b: 4, c: {r: 255, g: 255, b: 255} };
                    if (Math.sin(angle * 12 - t * 25) > 0.8 && dist < 450) return { b: 0.8 * (1 - dist/450), c: {r: 255, g: 255, b: 255} };
                } else {
                    let t = stateTimer - bngP; let shock = t * 18, debris = t * 8;
                    if (dist < shock && dist > shock - 60) return { b: (1 - dist/shock)*3, c: {r: 255, g: 245, b: 210} };
                    if (dist < debris) {
                        let n = fastNoise(px*0.4, py*0.4, gameFrame*0.06); let life = Math.max(0, 1 - t/450);
                        if (n > 0.7) return { b: life*2, c: {r:255, g:220, b:80} }; return { b: life, c: {r: 255, g: 100+n*140, b: 50} };
                    }
                }
            }
            if (currentState === 2) {
                let time = gameFrame * 0.01; let sTight = 0.38, rot = time * 2.8; let expAngle = Math.log(dist / 22) / sTight;
                let dAngle = (angle - expAngle + rot) % Math.PI; if (dAngle < 0) dAngle += Math.PI;
                let distScale = 1 - dist / (width * 0.7);
                if (distScale > 0) {
                    let intensity = dist < 70 ? (1 - dist/70)*2.5 : 0;
                    if (dist > 40) intensity += Math.exp(-Math.pow(dAngle - 1.5, 2)*6) * distScale * 1.5;
                    intensity += fastNoise(px*0.3, py*0.3, time)*0.3 * distScale;
                    if (Math.random() > 0.999) intensity += 2; 
                    return { b: intensity, c: {r: 180+distScale*75, g: 210, b: 255} };
                }
            }
            return { b: 0 };
        }

        function update() {
            gameFrame++; stateTimer++; const DUR = 50; 
            if (currentState === 1 && stateTimer === 180) shake = 40; if (shake > 0) shake *= 0.9;
            switch(currentState) {
                case 0: 
                    if (stateTimer === 10) setUiState(0); if (stateTimer === DUR) setUiState(1);
                    if (stateTimer === DUR*2) setUiState(2); if (stateTimer === DUR*3) setUiState(3);
                    if (stateTimer > DUR*4) { currentState = 1; stateTimer = 0; } break;
                case 1: 
                    if (stateTimer === 10) setUiState(4); if (stateTimer === DUR) setUiState(5);
                    if (stateTimer === DUR*2) setUiState(6); if (stateTimer === DUR*3) setUiState(7);
                    if (stateTimer === DUR*4) setUiState(8); if (stateTimer > DUR*5) { currentState = 2; stateTimer = 0; } break;
                case 2: 
                    if (stateTimer === 10) setUiState(9); if (stateTimer === DUR) setUiState(10);
                    if (stateTimer === DUR*2) setUiState(11); if (stateTimer > DUR*3 + 150) { setUiState(-1); currentState = 0; stateTimer = 0; } break;
            }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "black"; ctx!.fillRect(0, 0, width, height); update();
                const len = pixels.length;
                for (let i = 0; i < len; i++) {
                    const p = pixels[i]; const res = getPixelState(p.x, p.y);
                    p.brightness = res.b || 0; p.color = res.c || {r: 255, g: 255, b: 255};
                    p.draw();
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        resetRef.current = () => { currentState = 0; stateTimer = 0; gameFrame = 0; setUiState(-1); };

        initGrid(); 
        draw();

        return () => {
            window.removeEventListener('resize', initGrid);
            cancelAnimationFrame(animationFrameId);
        }
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-7-9">
            <div id="tc-7-9" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}><b>Cosmic Alchemy</b><br/>Inside those stars, something incredible happened.</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Hydrogen fused into helium.<br/>Helium into carbon. Carbon into heavier elements.</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}>The universe learned complexity.</div>
                <div className={`shared-text-element ${uiState === 3 ? 'active' : ''}`}>Every atom in your body—carbon, oxygen, nitrogen—<br/>was forged in the heart of a star.</div>
                <div className={`shared-text-element ${uiState === 4 ? 'active' : ''}`}><b>Death of Stars</b><br/>But stars don’t last forever.</div>
                <div className={`shared-text-element ${uiState === 5 ? 'active' : ''}`}>When they run out of fuel, they collapse.</div>
                <div className={`shared-text-element ${uiState === 6 ? 'active' : ''}`}>Some explode violently in <b>Supernovae</b>.</div>
                <div className={`shared-text-element ${uiState === 7 ? 'active' : ''}`}>In those explosions, the heaviest elements are formed.<br/>Gold. Iron. Calcium.</div>
                <div className={`shared-text-element ${uiState === 8 ? 'active' : ''}`}>Then, scattered like seeds across space.</div>
                <div className={`shared-text-element ${uiState === 9 ? 'active' : ''}`}><b>Galaxies Form</b><br/>Over billions of years, matter organized into galaxies.</div>
                <div className={`shared-text-element ${uiState === 10 ? 'active' : ''}`}>Billions of stars, all bound together by gravity.</div>
                <div className={`shared-text-element ${uiState === 11 ? 'active' : ''}`}>And one of them—just one—<br/>would come to matter to you.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}
