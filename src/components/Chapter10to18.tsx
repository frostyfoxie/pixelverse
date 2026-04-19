import { useEffect, useRef, useState } from 'react';

export function Chapter10to12({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let width = 0, height = 0; let pixels: any[] = []; const spacing = 6; 
        let gameFrame = 0; let currentState = 0; let stateTimer = 0; const DUR = 80;
        let animationFrameId: number;

        class Pixel {
            x: number; y: number; brightness: number; size: number; color: any;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.size = 2.2; this.color = {r: 255, g: 255, b: 255}; }
            draw() {
                if (this.brightness < 0.02) return;
                ctx!.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
                
                if (this.brightness > 0.7) { 
                    ctx!.globalAlpha = this.brightness * 0.25; 
                    ctx!.fillRect(this.x - this.size * 1.2, this.y - this.size * 1.2, this.size * 4.4, this.size * 4.4); 
                }
                
                ctx!.globalAlpha = Math.min(this.brightness, 1);
                ctx!.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
            }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Pixel(x, y)); }
        }

        const tex = (x: number, y: number, t: number) => Math.sin(x * 0.02 + t) * Math.cos(y * 0.02 + t * 0.5) + Math.sin(x * 0.05 - t) * Math.cos(y * 0.05 + t * 0.8) * 0.5;

        function getPixelState(px: number, py: number) {
            const cx = width / 2; const cy = height / 2;
            const dx = px - cx; const dy = py - cy; const dist = Math.sqrt(dx*dx + dy*dy); const angle = Math.atan2(dy, dx);
            if (currentState === 0) {
                let time = gameFrame * 0.02; let swirl = Math.sin(dist * 0.02 - angle * 4 + time * 2) + Math.cos(dist * 0.01 + angle * 2 - time);
                let nebColor = {r: 160 + swirl * 90, g: 30 + Math.abs(swirl) * 80, b: 200 - swirl * 50};
                if (dist < 50) { let flare = Math.sin(angle * 8 + time * 5) * 5; if (dist < 40 + flare) return { b: 2, c: {r: 255, g: 240, b: 200} }; }
                let filament = Math.pow(Math.max(0, Math.sin(swirl * 2.5)), 3) * (1 - dist/500);
                if (filament > 0.05) return { b: filament * 2.0, c: nebColor };
                if ((Math.sin(px * 1.5) * Math.cos(py * 1.5)) > 0.9997) return { b: 1, c: {r:200, g:220, b:255} };
            }
            if (currentState === 1) {
                let time = gameFrame * 0.02; if (dist < 60) return { b: 2.5, c: {r: 255, g: 210, b: 120} };
                let diskEdge = Math.abs(dist - 250) < 150;
                if (diskEdge) {
                    let n = tex(px * 0.3, py * 0.3, time * 0.5); let orbitSpeed = angle + (time * 500 / dist);
                    let grain = Math.sin(dist * 0.5 + orbitSpeed * 10);
                    if (grain > 0.75) return { b: (1 - Math.abs(dist - 250) / 150) * n * 1.5, c: {r: 255, g: 140, b: 60} };
                }
                let planets = [ {r: 180, a: time * 0.8, sz: 8, c: {r: 255, g: 150, b: 100}}, {r: 300, a: time * 0.4, sz: 12, c: {r: 60, g: 160, b: 255}} ];
                for (let p of planets) {
                    let px_p = Math.cos(p.a) * p.r; let py_p = Math.sin(p.a) * p.r;
                    let d = Math.sqrt((px - (cx + px_p))**2 + (py - (cy + py_p))**2);
                    if (d < p.sz) return { b: 2, c: p.c }; if (Math.abs(dist - p.r) < p.sz * 2.0) return { b: 0.02, c: {r:0, g:0, b:0} };
                }
            }
            if (currentState === 2) {
                let time = gameFrame * 0.015;
                if (dist < 200) {
                    let n = tex(px * 0.6, py * 0.6, time); let distNorm = dist / 200;
                    let isCrust = n < -0.15; let isMagma = n > 0.35;
                    let col = isCrust ? {r: 30, g: 20, b: 20} : {r: 220, g: 40, b: 10}; 
                    if (isMagma) col = {r: 255, g: 200, b: 50};
                    let rim = Math.pow(distNorm, 6) * 2; if (rim > 0.5) col = {r: 255, g: 100, b: 20};
                    let magmaGlow = isMagma ? 1.5 : 0;
                    return { b: (1.2 - distNorm) + rim + magmaGlow, c: col };
                }
                if (dist >= 200 && dist < 240) return { b: Math.pow(1 - (dist - 200) / 40, 2) * 0.8, c: {r: 255, g: 60, b: 20} };
                let star = Math.sin(px * 0.1) * Math.cos(py * 0.1);
                if (star > 0.998) return { b: 0.9, c: {r:255, g:255, b:255} };
            }
            return { b: 0 };
        }

        function update() {
            gameFrame++; stateTimer++;
            switch(currentState) {
                case 0: 
                    if (stateTimer === 10) setUiState(0); if (stateTimer === DUR) setUiState(1);
                    if (stateTimer > DUR * 2) { currentState = 1; stateTimer = 0; } break;
                case 1:
                    if (stateTimer === 10) setUiState(2); if (stateTimer === DUR) setUiState(3);
                    if (stateTimer > DUR * 2) { currentState = 2; stateTimer = 0; } break;
                case 2:
                    if (stateTimer === 10) setUiState(4); if (stateTimer === DUR) setUiState(5);
                    if (stateTimer > DUR * 4) { setUiState(-1); currentState = 0; stateTimer = 0; } break;
            }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "black"; ctx!.fillRect(0, 0, width, height); update();
                const len = pixels.length;
                for (let i = 0; i < len; i++) {
                    const p = pixels[i]; const res = getPixelState(p.x, p.y);
                    p.brightness = res.b || 0; p.color = res.c || {r: 255, g: 255, b: 255}; p.draw();
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        resetRef.current = () => { currentState = 0; stateTimer = 0; gameFrame = 0; setUiState(-1); };

        initGrid(); draw();
        return () => { window.removeEventListener('resize', initGrid); cancelAnimationFrame(animationFrameId); };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-10-12">
            <div id="tc-10-12" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}><b>A New Beginning</b><br/>Amidst the billions of stars, a small cloud of dust began to collapse.</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Our Sun was born—a modest star in the suburbs of the Milky Way.</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}><b>Accretion</b><br/>Leftover debris collided and merged, forming the planets.</div>
                <div className={`shared-text-element ${uiState === 3 ? 'active' : ''}`}>Among them was a small, rocky world, positioned just right.</div>
                <div className={`shared-text-element ${uiState === 4 ? 'active' : ''}`}><b>Early Earth</b><br/>A chaotic landscape of molten rock and constant bombardment.</div>
                <div className={`shared-text-element ${uiState === 5 ? 'active' : ''}`}>Yet, as it cooled, something miraculous happened...<br/>but that is a story for another time.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

export function Chapter13to15({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
        let width = 0, height = 0; let pixels: any[] = []; const spacing = 5; 
        let gameFrame = 0; let currentState = 0; let stateTimer = 0; const SCENE_DURATION = 480;
        let animationFrameId: number;

        class Point {
            x: number; y: number; brightness: number; color: any;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.color = {r: 255, g: 255, b: 255}; }
            draw() {
                if (this.brightness < 0.05) return;
                const size = 0.5 + (Math.min(this.brightness, 1.2) * 0.8);
                ctx!.globalAlpha = Math.min(this.brightness, 1.0); ctx!.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
                ctx!.fillRect(this.x - size, this.y - size, size * 2, size * 2);
            }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Point(x, y)); }
        }

        function drawJellyfish(px: number, py: number, jX: number, jY: number, pulse: number, time: number, scale = 1.0) {
            let dx = px - jX; let dy = py - jY; let d = Math.sqrt(dx*dx + dy*dy);
            let b = 0; let color = {r: 100, g: 180, b: 255};
            let headRadius = (40 + pulse * 15) * scale;
            if (d < headRadius && py < jY + (10 * scale)) {
                let intensity = (1 - d/headRadius); b = 0.8 + intensity * 0.6; color = {r: 150 + pulse * 50, g: 220, b: 255};
                return {b, c: color};
            }
            if (px > jX - headRadius && px < jX + headRadius && py >= jY) {
                for(let i = -2; i <= 2; i++) {
                    let tX = jX + (i * 15 * scale); let wave = Math.sin(py * 0.05 - time * 5 + i) * (10 * scale);
                    let distToTentacle = Math.abs(px - (tX + wave)); let tentacleLength = (100 + pulse * 40) * scale;
                    if (distToTentacle < 4 * scale && py < jY + tentacleLength) {
                        let fade = 1 - (py - jY) / tentacleLength; b = fade * 0.9; color = {r: 100, g: 180, b: 255};
                        return {b, c: color};
                    }
                }
            }
            return null;
        }

        function getPixelState(px: number, py: number) {
            const time = gameFrame * 0.02;
            if (currentState === 0) {
                let flow1 = Math.sin(px * 0.005 + time) * 100; let flow2 = Math.cos(py * 0.005 + time * 1.2) * 100;
                let distToInteraction = Math.abs((py - height/2) - flow1) + Math.abs((px - width/2) - flow2);
                let b = 0.05; let color = {r: 20, g: 45, b: 100};
                if (stateTimer > 180) {
                    let pulse = (Math.sin(time * 3) + 1) * 0.5; let jX = width/2 + Math.sin(time * 0.5) * 50; let jY = height/2 + Math.cos(time * 0.3) * 30;
                    let res = drawJellyfish(px, py, jX, jY, pulse, time, 1.0); if (res) return res;
                }
                if (distToInteraction < 60) b = Math.max(b, (1 - distToInteraction/60) * 0.35); return { b, c: color };
            }
            if (currentState === 1) {
                let b = 0.04; let color = {r: 40, g: 60, b: 80};
                for (let i = 0; i < 5; i++) {
                    let seed = i * 123.456; let cycleTime = time * 0.4 + seed;
                    let jX = (width * 0.2) + ((time * 40 + seed * 10) % (width * 0.6)); let jY = (height * 0.2) + (Math.sin(cycleTime) * height * 0.2) + (i * 80);
                    let pulse = (Math.sin(time * 4 + seed) + 1) * 0.5; let res = drawJellyfish(px, py, jX, jY, pulse, time, 0.6); 
                    if (res) { res.c.r += Math.sin(seed) * 30; res.c.g += Math.cos(seed) * 30; return res; }
                }
                if (Math.sin(px*py + time) > 0.998) { b = 0.3; color = {r:200, g:220, b:255}; }
                return { b, c: color };
            }
            if (currentState === 2) {
                let b = 0.05; let color = {r: 20, g: 140, b: 190};
                for (let i = 0; i < 7; i++) {
                    let xBase = (width / 8) * (i + 1); let drift = Math.sin(py * 0.008 + time + i) * 45; let actualX = xBase + drift;
                    let distToMain = Math.abs(px - actualX);
                    if (distToMain < 9) {
                        let flow = (Math.sin(py * 0.03 - time * 12) + 1) * 0.5;
                        b = 0.6 + flow * 0.5; color = {r: 130, g: 200 + flow * 30, b: 240};
                    }
                    let branchSide = i % 2 === 0 ? 1 : -1; let branchTrigger = Math.sin(py * 0.04 + i + time*0.5) > 0.65;
                    if (branchTrigger) {
                        let branchX = actualX + (branchSide * 50 * Math.sin(time + py*0.01)); let distToBranch = Math.abs(px - branchX);
                        if (distToBranch < 5) b = Math.max(b, 0.45);
                    }
                }
                return { b, c: color };
            }
            return { b: 0 };
        }

        function update() {
            gameFrame++; stateTimer++; const QUARTER = SCENE_DURATION / 4;
            switch(currentState) {
                case 0: 
                    if (stateTimer === 1) setUiState(0); if (stateTimer === QUARTER) setUiState(1);
                    if (stateTimer === QUARTER * 2) setUiState(2); if (stateTimer === QUARTER * 3) setUiState(3);
                    if (stateTimer >= SCENE_DURATION) { currentState = 1; stateTimer = 0; } break;
                case 1: 
                    if (stateTimer === 1) setUiState(4); if (stateTimer === QUARTER * 1.3) setUiState(5);
                    if (stateTimer === QUARTER * 2.6) setUiState(6); if (stateTimer >= SCENE_DURATION) { currentState = 2; stateTimer = 0; } break;
                case 2: 
                    if (stateTimer === 1) setUiState(7); if (stateTimer === QUARTER * 1.3) setUiState(8);
                    if (stateTimer === QUARTER * 2.6) setUiState(9); if (stateTimer >= SCENE_DURATION) { setUiState(-1); currentState = 0; stateTimer = 0; } break;
            }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "#050508"; ctx!.fillRect(0, 0, width, height); update();
                for (let i = 0; i < pixels.length; i++) {
                    const p = pixels[i]; const res = getPixelState(p.x, p.y);
                    p.brightness = res.b || 0; p.color = res.c || {r: 255, g: 255, b: 255}; p.draw();
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        resetRef.current = () => { currentState = 0; stateTimer = 0; gameFrame = 0; setUiState(-1); };

        initGrid(); draw();
        return () => { window.removeEventListener('resize', initGrid); cancelAnimationFrame(animationFrameId); };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-13-15">
            <div id="tc-13-15" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}><b>The Origin of Life</b><br/>Somewhere in those oceans, molecules began to organize.</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Not alive—yet. But close.</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}>Then, somehow—something began to replicate.</div>
                <div className={`shared-text-element ${uiState === 3 ? 'active' : ''}`}>Imperfect copies. Small errors.<br/>That was enough. Evolution had begun.</div>
                <div className={`shared-text-element ${uiState === 4 ? 'active' : ''}`}><b>Billions of Years of Trial</b><br/>Life didn’t aim for perfection. It just kept going.</div>
                <div className={`shared-text-element ${uiState === 5 ? 'active' : ''}`}>Most attempts failed.<br/>Extinction after extinction.</div>
                <div className={`shared-text-element ${uiState === 6 ? 'active' : ''}`}>But some survived.<br/>And those survivors changed.</div>
                <div className={`shared-text-element ${uiState === 7 ? 'active' : ''}`}><b>Complexity</b><br/>Cells became more advanced. They learned to cooperate.</div>
                <div className={`shared-text-element ${uiState === 8 ? 'active' : ''}`}>Multicellular life appeared.<br/>Eyes. Limbs. Movement.</div>
                <div className={`shared-text-element ${uiState === 9 ? 'active' : ''}`}>The world filled with strange forms.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

export function Chapter16({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let width = 0, height = 0; let pixels: any[] = []; const spacing = 4; let gameFrame = 0; let stateTimer = 0; let groundY = 0;
        let dino = { x: 120, y: 0, vy: 0, gravity: 1.4, jumpPower: -20, isJumping: false };
        let obstacles: any[] = []; let clouds: any[] = []; let scrollSpeed = 12;
        let animationFrameId: number;

        const DINO_BODY =[ "                ███████████","                ███████████", "             ████  ██████", "             ███████████", "             ███████████", "             ███████████", "              ████████  ", "               ██████████", "█              ████████ ", "█             ████████  ", "██           ████████   ", "███         ██████████  ", "███      ████████████  ", "████    █████████████  ", "██████████████████████  ", " █████████████████████  ", "  ████████████████████  ", "   ██████████████████   ", "    ████████████████    ", "     ██████████████     ", "      ████████████      " ];
        const LEG_STILL =[ "        █████  ███      ", "        ███    ███      ", "        ███    ███      " ];
        const LEG_LEFT_UP =[ "        █████  ███      ", "               ███      ", "               ███      " ];
        const LEG_RIGHT_UP =[ "        ███    █████    ", "        ███             ", "        ███             " ];
        const CACTUS_SPRITE =[ "    ████    ", "    ████    ", "██  ████  ██", "██  ████  ██", "████████████", "    ████    ", "    ████    ", "    ████    " ];
        const CLOUD_STRUCTURE =[ "            ███████         ", "        ████       ███      ", "     ███              ██    ", "   ██                   ██  ", " ███                     ██ ", "███                       ██", " ██████████████████████████ " ];

        class Pixel {
            x: number; y: number; brightness: number; color: any;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.color = { r: 255, g: 255, b: 255 }; }
            draw() {
                if (this.brightness <= 0) return;
                ctx!.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
                
                if (this.brightness > 0.8) {
                    ctx!.globalAlpha = this.brightness * 0.25;
                    ctx!.fillRect(this.x - 3, this.y - 3, 6, 6);
                }
                
                ctx!.globalAlpha = this.brightness; 
                ctx!.fillRect(this.x - 1.5, this.y - 1.5, 3, 3);
            }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight;
            groundY = height * 0.6; dino.y = groundY - 80; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Pixel(x, y)); }
        }

        function update() {
            gameFrame++; stateTimer++; const DURATION = 300;
            if (stateTimer === 10) setUiState(0); if (stateTimer === DURATION) setUiState(1);
            if (stateTimer === DURATION * 2) setUiState(2); if (stateTimer === DURATION * 3) { stateTimer = 0; setUiState(-1); }

            if (!dino.isJumping) {
                obstacles.forEach(obs => { if (obs.x - dino.x < 180 && obs.x > dino.x) { dino.isJumping = true; dino.vy = dino.jumpPower; } });
            } else {
                dino.y += dino.vy; dino.vy += dino.gravity;
                if (dino.y >= groundY - 88) { dino.y = groundY - 88; dino.isJumping = false; dino.vy = 0; }
            }

            if (gameFrame % 85 === 0) obstacles.push({ x: width + 50 });
            obstacles.forEach(o => o.x -= scrollSpeed); obstacles = obstacles.filter(o => o.x > -100);
            if (gameFrame % 140 === 0) clouds.push({ x: width + 50, y: 60 + Math.random() * 100, speed: 1.2 + Math.random() * 0.8, scale: 4 });
            clouds.forEach(c => c.x -= c.speed); clouds = clouds.filter(c => c.x > -300);
        }

        function checkDinoPixel(px: number, py: number) {
            const pixelSize = 3.2; let nx = Math.floor((px - dino.x) / pixelSize); let ny = Math.floor((py - dino.y) / pixelSize);
            if (nx < 0 || nx >= 24) return false;
            if (ny >= 0 && ny < DINO_BODY.length) return DINO_BODY[ny][nx] === '█';
            let legY = ny - DINO_BODY.length;
            if (legY >= 0 && legY < 3) {
                if (dino.isJumping) return LEG_STILL[legY][nx] === '█';
                return ((Math.floor(gameFrame / 5) % 2 === 0) ? LEG_LEFT_UP : LEG_RIGHT_UP)[legY][nx] === '█';
            }
            return false;
        }

        function checkCactusPixel(px: number, py: number, cx: number) {
            let nx = Math.floor((px - cx) / 4.5); let ny = Math.floor((py - (groundY - 35)) / 4.5);
            if (nx < 0 || nx >= 12 || ny < 0 || ny >= 8) return false; return CACTUS_SPRITE[ny][nx] === '█';
        }

        function checkCloudPixel(px: number, py: number, cloud: any) {
            let nx = Math.floor((px - cloud.x) / cloud.scale); let ny = Math.floor((py - cloud.y) / cloud.scale);
            const rows = CLOUD_STRUCTURE.length; const cols = CLOUD_STRUCTURE[0].length;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;
            if (CLOUD_STRUCTURE[ny][nx] !== '█') return false;
            if (nx === 0 || nx === cols - 1 || ny === 0 || ny === rows - 1) return true;
            if (CLOUD_STRUCTURE[ny-1][nx] === ' ' || CLOUD_STRUCTURE[ny+1][nx] === ' ' || CLOUD_STRUCTURE[ny][nx-1] === ' ' || CLOUD_STRUCTURE[ny][nx+1] === ' ') return true;
            return false;
        }

        function updatePixel(p: any) {
            p.brightness = 0; p.color = { r: 255, g: 255, b: 255 };
            if (checkDinoPixel(p.x, p.y)) { p.brightness = 1; return; }
            if (Math.abs(p.y - groundY) < 1.5 && (p.x + gameFrame * scrollSpeed) % 180 < 120) { p.brightness = 0.3; return; }
            for (let obs of obstacles) { if (checkCactusPixel(p.x, p.y, obs.x)) { p.brightness = 0.9; p.color = { r: 150, g: 255, b: 150 }; return; } }
            for (let c of clouds) { if (checkCloudPixel(p.x, p.y, c)) { p.brightness = 0.35; return; } }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "black"; ctx!.fillRect(0, 0, width, height); update();
                for (let i = 0; i < pixels.length; i++) { updatePixel(pixels[i]); pixels[i].draw(); }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        resetRef.current = () => { stateTimer = 0; gameFrame = 0; setUiState(-1); obstacles=[]; clouds=[]; dino.y = groundY-80; dino.isJumping = false; };

        initGrid(); draw();
        return () => { window.removeEventListener('resize', initGrid); cancelAnimationFrame(animationFrameId); };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-16">
            <div id="tc-16" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}><b>Dinosaurs</b><br/>For millions of years, they dominated Earth.</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Massive. Adapted. Successful.</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}>They ruled longer than humans have existed.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

export function Chapter17to18({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let width = 0, height = 0; let pixels: any[] = []; const spacing = 4; 
        let currentChapter = 6; let stateTimer = 0; let shake = 0; let globalAlpha = 1;
        let asteroid = { x: 0, y: 0, z: 2000, targetX: 0, targetY: 0, size: 5, trail: [] as any[], currentX: 0, currentY: 0, currentSize: 0 };
        let impacted = false; let impactProgress = 0; let creatures: any[] = []; let fireflies: any[] = [];
        let animationFrameId: number;

        class Pixel {
            x: number; y: number; brightness: number; r: number; g: number; b: number;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.r = 255; this.g = 255; this.b = 255; }
            draw() {
                if (this.brightness <= 0.01) return;
                let renderX = this.x; let renderY = this.y;
                if (shake > 0) { renderX += (Math.random() - 0.5) * shake; renderY += (Math.random() - 0.5) * shake; }
                
                ctx!.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
                
                if (this.brightness > 0.8) {
                    ctx!.globalAlpha = Math.min(this.brightness * globalAlpha * 0.3, 1);
                    ctx!.fillRect(renderX - 1.8, renderY - 1.8, 5.4, 5.4);
                }
                
                ctx!.globalAlpha = Math.min(this.brightness * globalAlpha, 1);
                ctx!.fillRect(renderX, renderY, 1.8, 1.8);
            }
        }

        function resetAsteroid() {
            asteroid.z = 1500; asteroid.x = width * 1.2; asteroid.y = -height * 0.2; asteroid.targetX = width * 0.3; asteroid.targetY = height * 0.85;
            asteroid.trail = []; impacted = false; impactProgress = 0;
        }

        function initLife() {
            creatures = [];
            for (let i = 0; i < 7; i++) {
                creatures.push({ originX: width * (0.15 + Math.random() * 0.7), originY: height * (0.75 + Math.random() * 0.15), x: 0, y: 0, size: 6 + Math.random() * 6, eyeGlow: 0, blinkTimer: Math.random() * 100, isBlinking: false, emergence: 0, active: false, startTime: 100 + (i * 110), breathPhase: Math.random() * Math.PI * 2 });
                creatures[i].x = creatures[i].originX; creatures[i].y = creatures[i].originY;
            }
            fireflies = [];
            for (let i = 0; i < 18; i++) { fireflies.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, brightness: 0, phase: Math.random() * Math.PI * 2, pulseSpeed: 0.02 + Math.random() * 0.04 }); }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Pixel(x, y)); }
            resetAsteroid(); initLife();
        }

        function update() {
            stateTimer++;
            if (currentChapter === 6) {
                if (stateTimer === 10) setUiState(0); if (stateTimer === 160) setUiState(1);
                if (!impacted) {
                    asteroid.z -= 12; let progress = (1500 - asteroid.z) / 1500;
                    asteroid.currentX = asteroid.x + (asteroid.targetX - asteroid.x) * progress; asteroid.currentY = asteroid.y + (asteroid.targetY - asteroid.y) * progress; asteroid.currentSize = 2 + progress * 60;
                    asteroid.trail.push({ x: asteroid.currentX, y: asteroid.currentY, size: asteroid.currentSize, life: 1 });
                    if (asteroid.trail.length > 30) asteroid.trail.shift();
                    if (asteroid.z <= 0) { impacted = true; setUiState(2); shake = 60; stateTimer = 0; }
                } else {
                    impactProgress += 0.004; shake *= 0.94; if (stateTimer === 60) setUiState(3);
                    if (impactProgress > 2.8) { currentChapter = 7; stateTimer = 0; globalAlpha = 0; setUiState(-1); }
                }
            } else if (currentChapter === 7) {
                if (globalAlpha < 1) globalAlpha += 0.005;
                if (stateTimer === 60) setUiState(4); if (stateTimer === 220) setUiState(5); if (stateTimer === 380) setUiState(6); if (stateTimer === 540) setUiState(7);
                creatures.forEach(c => {
                    if (stateTimer > c.startTime) {
                        c.active = true; if (c.emergence < 1) c.emergence += 0.004;
                        c.blinkTimer--; if (c.blinkTimer <= 0) { c.isBlinking = !c.isBlinking; c.blinkTimer = c.isBlinking ? 8 : 120 + Math.random() * 250; }
                        c.breathPhase += 0.035; c.y = c.originY - (c.emergence * 8) + Math.sin(c.breathPhase) * 1.5;
                        c.eyeGlow = !c.isBlinking ? Math.min(1, c.eyeGlow + 0.04) : 0;
                    }
                });
                fireflies.forEach(f => {
                    f.x += f.vx + Math.sin(stateTimer * 0.02 + f.phase) * 0.4; f.y += f.vy + Math.cos(stateTimer * 0.02 + f.phase) * 0.4;
                    f.phase += f.pulseSpeed; f.brightness = (Math.sin(f.phase) + 1) / 2;
                    if (f.x < 0) f.x = width; if (f.x > width) f.x = 0; if (f.y < 0) f.y = height; if (f.y > height) f.y = 0;
                });
                if (stateTimer > 1100) { currentChapter = 6; stateTimer = 0; resetAsteroid(); initLife(); setUiState(-1); }
            }
        }

        function updatePixel(p: any) {
            p.brightness = 0; p.r = 255; p.g = 255; p.b = 255;
            if (currentChapter === 6) {
                if (p.y > height * 0.75) {
                    let groundDepth = (p.y - height * 0.75) / (height * 0.25);
                    if (!impacted) {
                        let dither = (Math.sin(p.x * 0.2) + Math.cos(p.y * 0.2 + stateTimer * 0.01)) * 0.1; p.brightness = 0.1 + groundDepth * 0.15 + dither; p.r = 30 + groundDepth * 20; p.g = 30 + groundDepth * 10; p.b = 40;
                    } else {
                        let heat = Math.max(0, 1 - (impactProgress * 0.8)); let wave = Math.sin(p.x * 0.05 - impactProgress * 20) * 0.1;
                        p.brightness = (0.2 + heat * 0.8) + wave; p.r = 255; p.g = 40 + (1 - heat) * 100; p.b = 20;
                    }
                }
                if (!impacted) {
                    const dx = p.x - asteroid.currentX; const dy = p.y - asteroid.currentY; const distSq = dx * dx + dy * dy;
                    if (distSq < asteroid.currentSize * asteroid.currentSize) { p.brightness = 1; p.r = 255; p.g = 240; p.b = 210; return; }
                    for (let i = 0; i < asteroid.trail.length; i++) {
                        const t = asteroid.trail[i]; const tdx = p.x - t.x; const tdy = p.y - t.y; const tDistSq = tdx * tdx + tdy * tdy;
                        let trailRatio = i / asteroid.trail.length; let tSize = t.size * (0.85 + trailRatio * 0.6);
                        if (tDistSq < tSize * tSize) { p.brightness = trailRatio * 0.75; p.r = 255; p.g = 60 + trailRatio * 160; p.b = 40; }
                    }
                } else {
                    const bx = asteroid.targetX; const by = asteroid.targetY; const bdx = p.x - bx; const bdy = p.y - by;
                    const bDist = Math.sqrt(bdx * bdx + bdy * bdy); const wavePos = impactProgress * width * 2.8; const waveWidth = 220 * (1 + impactProgress);
                    if (bDist < wavePos && bDist > wavePos - waveWidth) { let edge = (wavePos - bDist) / waveWidth; p.brightness = Math.pow(edge, 0.45); p.r = 255; p.g = 210 + edge * 45; p.b = 160; return; }
                    if (bDist < wavePos) {
                        let fade = Math.max(0, 1 - impactProgress * 1.15);
                        if (Math.random() < fade * 0.45) { p.brightness = fade * (0.6 + Math.random() * 0.4); p.r = 255; p.g = 110 + Math.random() * 110; p.b = 20; }
                        else { let dust = Math.max(0, fade - 0.25); p.brightness = Math.random() < 0.12 ? dust * 0.25 : 0; p.r = p.g = p.b = 110; }
                    }
                }
            } else {
                if (p.y > height * 0.72) {
                    let depth = (p.y - height * 0.72) / (height * 0.28); let noise = Math.sin(p.x * 0.08) * Math.cos(p.y * 0.12) * 0.04;
                    p.brightness = 0.06 + depth * 0.16 + noise; p.r = 45 + depth * 35; p.g = 50 + depth * 30; p.b = 70 + depth * 45;
                    creatures.forEach(c => { let distSq = (p.x - c.originX)**2 + (p.y - c.originY)**2; if (distSq < (c.size * 2.6)**2) p.brightness *= (0.15 + Math.min(1, Math.sqrt(distSq) / (c.size * 2.6)) * 0.85); });
                    creatures.forEach(c => { if (c.active && (p.x - c.x)**2 + ((p.y - c.y)*2)**2 < (c.size * c.emergence)**2) { p.brightness = 0.05 + (1 - c.emergence) * 0.12; p.r = 22; p.g = 22; p.b = 28; } });
                    creatures.forEach(c => { if (c.active && c.eyeGlow > 0) { let lightDist = Math.sqrt((p.x - c.x)**2 + (p.y - (c.y + 10))**2); if (lightDist < 45) { let lightPower = (1 - lightDist / 45) * 0.28 * c.eyeGlow; p.brightness += lightPower; p.r += lightPower * 110; p.g += lightPower * 160; } } });
                }
                fireflies.forEach(f => { let distSq = (p.x - f.x)**2 + (p.y - f.y)**2; if (distSq < 5) { p.brightness = f.brightness; p.r = 255; p.g = 255; p.b = 160; } else if (distSq < 120) { let halo = (1 - Math.sqrt(distSq) / 11) * 0.35 * f.brightness; if (halo > 0) { p.brightness += halo; p.r = Math.min(255, p.r + halo * 210); p.g = Math.min(255, p.g + halo * 210); } } });
                creatures.forEach(c => { if (!c.active || c.isBlinking) return; let eyeSpacing = c.size * 0.48; [ -eyeSpacing, eyeSpacing ].forEach(offsetX => { if ((p.x - (c.x + offsetX))**2 + (p.y - (c.y - 2))**2 < 6) { p.brightness = 0.95 * c.eyeGlow; p.r = 190; p.g = 255; p.b = 110; } }); });
                let fogNoise = Math.sin(p.x * 0.005 + stateTimer * 0.02) * Math.cos(p.y * 0.01 - stateTimer * 0.01);
                if (p.y < height * 0.85) { let fogDensity = Math.max(0, fogNoise * 0.14); p.brightness += fogDensity; p.r = Math.min(255, p.r + fogDensity * 55); p.g = Math.min(255, p.g + fogDensity * 65); p.b = Math.min(255, p.b + fogDensity * 85); }
            }
            if (p.brightness < 0.05 && p.y < height * 0.65) { if (Math.sin(p.x * 0.15) * Math.cos(p.y * 0.15) > 0.9994) { p.brightness = 0.2; p.r = 160; p.g = 180; p.b = 220; } }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "black"; ctx!.fillRect(0, 0, width, height); update();
                for (let i = 0; i < pixels.length; i++) { updatePixel(pixels[i]); pixels[i].draw(); }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        resetRef.current = () => { currentChapter = 6; stateTimer = 0; globalAlpha = 1; resetAsteroid(); initLife(); setUiState(-1); };

        initGrid(); draw();
        return () => { window.removeEventListener('resize', initGrid); cancelAnimationFrame(animationFrameId); };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-17-18">
            <div id="tc-17-18" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}><b>The Impact</b><br/>Then—a rock from space.</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Fast. Silent. Unstoppable.</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}>It hit.</div>
                <div className={`shared-text-element ${uiState === 3 ? 'active' : ''}`}><b>Firestorms. Darkness. Collapse.</b><br/>Most life disappeared.</div>
                <div className={`shared-text-element ${uiState === 4 ? 'active' : ''}`}><b>Survival</b><br/>But not all.</div>
                <div className={`shared-text-element ${uiState === 5 ? 'active' : ''}`}>Small creatures endured.</div>
                <div className={`shared-text-element ${uiState === 6 ? 'active' : ''}`}>Hidden. Adaptive. Resilient.</div>
                <div className={`shared-text-element ${uiState === 7 ? 'active' : ''}`}>They inherited the world.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

