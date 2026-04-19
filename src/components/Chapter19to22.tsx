import { useEffect, useRef, useState } from 'react';

export function Chapter19to20({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiState, setUiState] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let width = 0, height = 0, centerX = 0, centerY = 0; let pixels: any[] = []; const spacing = 4;
        let stateTimer = 0; let activeScene = 'mammals';
        let arrows: any[] = []; let fireParticles: any[] = [];
        let animationFrameId: number;

        class Pixel {
            x: number; y: number; brightness: number; r: number; g: number; b: number;
            constructor(x: number, y: number) { this.x = x; this.y = y; this.brightness = 0; this.r = 255; this.g = 255; this.b = 255; }
            draw() {
                if (this.brightness <= 0.02) return;
                ctx!.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
                
                if (this.brightness > 0.6) {
                    ctx!.globalAlpha = this.brightness * 0.3;
                    ctx!.fillRect(this.x - 2.5, this.y - 2.5, 7, 7);
                }
                
                ctx!.globalAlpha = Math.min(this.brightness, 1); 
                ctx!.fillRect(this.x, this.y, 2, 2);
            }
        }

        function initGrid() {
            width = canvas!.width = window.innerWidth; height = canvas!.height = window.innerHeight;
            centerX = width / 2; centerY = height / 2; pixels = [];
            for (let x = 0; x < width; x += spacing) { for (let y = 0; y < height; y += spacing) pixels.push(new Pixel(x, y)); }
        }

        function checkChibiStickman(px: number, py: number, person: any) {
            const { x, y, scale, type } = person; const headR = 25 * scale; const headY = y - 55 * scale;
            if (Math.sqrt((px - x)**2 + (py - headY)**2) < headR && Math.sqrt((px - x)**2 + (py - headY)**2) > headR - 2.5) return true;
            if (type === 'builder' || type === 'casual') { const hatH = 35 * scale; const localY = py - (headY - headR + 4); if (localY < 0 && localY > -hatH) { const widthAtY = (headR * 1.8 * (localY + hatH)) / hatH; if (Math.abs(px - x) < widthAtY / 2) return true; } }
            const bodyH = 22 * scale; if (Math.abs(px - x) < 1.5 * scale && py >= headY + headR - 2 && py <= headY + headR + bodyH) return true;
            const armY = headY + headR + 8 * scale;
            if (type === 'hunter') {
                const pullProgress = Math.sin(stateTimer * 0.08) * 0.5 + 0.5; const bowX = x + 35 * scale; const pullX = x - (pullProgress * 15 * scale);
                if (lineDist(px, py, x, armY, pullX, armY) < 1.8) return true; if (lineDist(px, py, x, armY, bowX, armY) < 1.8) return true;
                const arcR = 45 * scale; const arcCX = bowX - arcR + (pullProgress * 5); const arcDist = Math.sqrt((px - arcCX)**2 + (py - armY)**2); const angle = Math.atan2(py - armY, px - arcCX);
                if (Math.abs(arcDist - arcR) < 2 && Math.abs(angle) < 1.1) return true;
                const topTipY = armY - Math.sin(1.1) * arcR; const topTipX = arcCX + Math.cos(1.1) * arcR; const botTipY = armY + Math.sin(1.1) * arcR; const botTipX = arcCX + Math.cos(1.1) * arcR;
                if (lineDist(px, py, pullX, armY, topTipX, topTipY) < 1) return true; if (lineDist(px, py, pullX, armY, botTipX, botTipY) < 1) return true;
            } else if (type === 'firemaker') {
                const rub = Math.sin(stateTimer * 0.8) * 10;
                if (lineDist(px, py, x, armY, x - 15*scale, armY + 20 + rub) < 1.8) return true; if (lineDist(px, py, x, armY, x + 15*scale, armY + 20 + rub) < 1.8) return true;
            } else {
                if (lineDist(px, py, x, armY, x - 20*scale, armY + 15*scale) < 1.8) return true; if (lineDist(px, py, x, armY, x + 20*scale, armY + 15*scale) < 1.8) return true;
            }
            const legY = headY + headR + bodyH; const walk = type === 'builder' ? Math.sin(stateTimer * 0.12) * 12 : 0;
            if (lineDist(px, py, x, legY, x - 12 - walk, legY + 20) < 2) return true; if (lineDist(px, py, x, legY, x + 12 + walk, legY + 20) < 2) return true;
            if (type === 'builder') {
                const wx = x + 60 * scale; const wy = legY + 10; const wd = Math.sqrt((px - wx)**2 + (py - wy)**2);
                if (Math.abs(wd - 25*scale) < 2.5) return true;
                const rot = stateTimer * 0.1;
                if (Math.abs((px-wx)*Math.sin(rot) - (py-wy)*Math.cos(rot)) < 1.5 && wd < 25*scale) return true;
                if (Math.abs((px-wx)*Math.cos(rot) + (py-wy)*Math.sin(rot)) < 1.5 && wd < 25*scale) return true;
            }
            return false;
        }

        function lineDist(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
            const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1; const dot = A * C + B * D, lenSq = C * C + D * D;
            let p = -1; if (lenSq !== 0) p = dot / lenSq; let xx, yy;
            if (p < 0) { xx = x1; yy = y1; } else if (p > 1) { xx = x2; yy = y2; } else { xx = x1 + p * C; yy = y1 + p * D; }
            return Math.sqrt((x-xx)**2 + (y-yy)**2);
        }

        function update() {
            stateTimer++;
            if (stateTimer < 400) { activeScene = 'mammals'; if (stateTimer === 20) setUiState(0); if (stateTimer === 200) setUiState(1); }
            else if (stateTimer < 900) { activeScene = 'hunter'; if (stateTimer === 410) setUiState(2); if (stateTimer % 100 === 0) arrows.push({ x: centerX + 40, y: centerY - 15, vx: 20, vy: -6 }); }
            else if (stateTimer < 1400) { activeScene = 'wheel'; if (stateTimer === 910) setUiState(3); if (stateTimer === 1150) setUiState(4); }
            else if (stateTimer < 1900) { activeScene = 'fire'; if (stateTimer === 1410) setUiState(5); }
            else { stateTimer = 0; arrows = []; }

            arrows.forEach((a, i) => { a.x += a.vx; a.y += a.vy; a.vy += 0.22; if (a.x > width || a.y > height) arrows.splice(i, 1); });
            if (activeScene === 'fire') { for (let i = 0; i < 6; i++) fireParticles.push({ x: centerX + (Math.random() - 0.5) * 30, y: centerY + 65, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 8 - 4, life: 1.0, size: 20 + Math.random() * 20 }); }
            fireParticles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; if (p.life <= 0) fireParticles.splice(i, 1); });
        }

        function updatePixel(p: any) {
            p.brightness = 0; p.r = 255; p.g = 255; p.b = 255;
            if (p.y > centerY + 80) { let depth = (p.y - (centerY + 80)) / (height - (centerY + 80)); p.brightness = 0.08 + depth * 0.15; p.r = 20; p.g = 25; p.b = 45; }
            if (activeScene === 'mammals') { [ -200, 0, 200 ].forEach((offset, i) => { let cx = centerX + offset + Math.sin(stateTimer * 0.04 + i) * 20; let cy = centerY + 45; if (Math.sqrt((p.x-cx)**2 + (p.y-cy)**2) < 30 + i*5) { p.brightness = 0.4; p.r = 100; p.g = 140; p.b = 255; } }); }
            if (activeScene === 'hunter') { if (checkChibiStickman(p.x, p.y, { x: centerX, y: centerY + 40, scale: 1.2, type: 'hunter' })) { p.brightness = 1; p.r = 255; p.g = 255; p.b = 255; } arrows.forEach(a => { if (lineDist(p.x, p.y, a.x, a.y, a.x - 25, a.y - (a.vy*0.8)) < 2) { p.brightness = 1; p.r = 255; p.g = 255; p.b = 255; } }); }
            if (activeScene === 'wheel') { if (checkChibiStickman(p.x, p.y, { x: centerX - 80, y: centerY + 40, scale: 1.2, type: 'builder' })) { p.brightness = 1; p.r = 255; p.g = 255; p.b = 255; } }
            if (activeScene === 'fire') {
                if (checkChibiStickman(p.x, p.y, { x: centerX - 140, y: centerY + 40, scale: 1.2, type: 'firemaker' })) { p.brightness = 1; p.r = 255; p.g = 255; p.b = 255; } 
                if (checkChibiStickman(p.x, p.y, { x: centerX + 140, y: centerY + 40, scale: 1.2, type: 'casual' })) { p.brightness = 1; p.r = 255; p.g = 255; p.b = 255; }
                fireParticles.forEach(fp => { let distSq = (p.x - fp.x)**2 + (p.y - fp.y)**2; let flameSize = fp.size * fp.life; if (distSq < flameSize * flameSize) { let f = (1 - Math.sqrt(distSq)/flameSize); p.brightness += f * fp.life * 1.5; p.r = 255; p.g = 50 + 180 * f; p.b = 20 * f; } });
            }
            // Enhance starfield with color
            if (p.brightness < 0.05 && p.y < centerY + 60) { let st = Math.sin(p.x * 0.3) * Math.cos(p.y * 0.3); if (st > 0.9995) { p.brightness = 0.5 + Math.random() * 0.5; p.r = 220; p.g = 240; p.b = 255; } }
        }

        function draw() {
            if (activeRef.current) {
                ctx!.fillStyle = "black"; ctx!.fillRect(0, 0, width, height); update();
                for (let i = 0; i < pixels.length; i++) { updatePixel(pixels[i]); pixels[i].draw(); }
            }
            animationFrameId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', initGrid);
        resetRef.current = () => { stateTimer = 0; activeScene = 'mammals'; arrows = []; fireParticles = []; setUiState(-1); };

        initGrid(); draw();
        return () => { window.removeEventListener('resize', initGrid); cancelAnimationFrame(animationFrameId); };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-19-20">
            <div id="tc-19-20" className="shared-text-container z-10 relative">
                <div className={`shared-text-element ${uiState === 0 ? 'active' : ''}`}><b>Mammals Rise</b><br/>They grew. Diversified. Experimented.</div>
                <div className={`shared-text-element ${uiState === 1 ? 'active' : ''}`}>Among them— primates.</div>
                <div className={`shared-text-element ${uiState === 2 ? 'active' : ''}`}><b>Humans</b><br/>One branch evolved something unusual.</div>
                <div className={`shared-text-element ${uiState === 3 ? 'active' : ''}`}>Awareness. The ability to think… about thinking.</div>
                <div className={`shared-text-element ${uiState === 4 ? 'active' : ''}`}>To question. To imagine.</div>
                <div className={`shared-text-element ${uiState === 5 ? 'active' : ''}`}>To understand the universe— even partially.</div>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

export function Chapter21({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [currentTextIndex, setCurrentTextIndex] = useState(-1);

    const narrative = [ "You learned to build.<br/>To communicate.<br/>To record.", "You mapped the stars<br/>that created you.", "You discovered the laws<br/>that shaped everything.", "Out of all the chaos—<br/>all the randomness—<br/>all the time—", "you exist.", "Right now.", "Reading this.", "The universe didn’t owe you this.", "It didn’t plan for you.", "It didn’t guarantee anything.", "And yet—<br/>against absurd odds—", "here you are.", "From nothing…<br/>to something…", "to someone who can understand it.", "Out of billion possibilities where this entire world would be dead,<br/>somehow the things do exist." ];

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let width = 0, height = 0; let particles: any[] = []; const PARTICLE_COUNT = 15000; let frame = 0;
        let sceneState = 'narrative'; let shatterTriggered = false; let stickmanZ = 600; let stickmanRotY = 0; let solidification = 0; 
        let walkPhase = 0; let activeTextRects: any[] = [];
        let narrativeTimeout: any; let animationFrameId: number;

        function createStickmanParticle() {
            let r = Math.random();
            function R(spread: number) { let u = Math.random() - 0.5, v = Math.random() - 0.5, w = Math.random() - 0.5; return { ox: u*spread, oy: v*spread, oz: w*spread }; }
            let thick = 15;
            if (r < 0.25) { 
                let u = Math.random() - 0.5, v = Math.random() - 0.5, w = Math.random() - 0.5;
                let l = Math.sqrt(u*u+v*v+w*w) || 1; let rad = Math.random() * 25;
                return { type: 'head', ox: (u/l)*rad, oy: (v/l)*rad, oz: (w/l)*rad, sizeMult: Math.random() * 2.5 + 1 };
            }
            else if (r < 0.45) return { type: 'torso', t: Math.random(), ...R(thick), sizeMult: Math.random() * 2 + 1 };
            else if (r < 0.55) return { type: 'armL', t: Math.random(), ...R(thick) };
            else if (r < 0.65) return { type: 'armR', t: Math.random(), ...R(thick) };
            else if (r < 0.8) return { type: 'legL', t: Math.random(), ...R(thick) };
            else return { type: 'legR', t: Math.random(), ...R(thick) };
        }

        class Particle {
            x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; baseSize: number; mode: string; type: string; t: number; ox: number; oy: number; oz: number; targetX?: number; targetY?: number; targetScale?: number; sizeMult: number; originX: number; originY: number;
            constructor() {
                this.x = Math.random() * window.innerWidth; this.y = Math.random() * window.innerHeight; this.z = 0;
                this.originX = this.x; this.originY = this.y;
                let angle = Math.random() * Math.PI * 2;
                let speed = Math.random() * 25 + 10;
                this.vx = Math.cos(angle) * speed; 
                this.vy = Math.sin(angle) * speed; 
                this.vz = (Math.random() - 0.5) * 40;
                this.baseSize = Math.random() * 2.5 + 0.5; this.mode = 'fly';
                const data = createStickmanParticle(); this.type = data.type; this.t = data.t || 0; 
                this.ox = data.ox; this.oy = data.oy; this.oz = data.oz; this.sizeMult = data.sizeMult || 1;
                this.size = this.baseSize;
            }
            update() {
                if (this.mode === 'explode') {
                    if (!this.vx) {
                        let dx = this.x - width/2; let dy = this.y - height/2;
                        let r = Math.sqrt(dx*dx + dy*dy) || 1;
                        this.vx = (dx/r) * (20 + Math.random()*30);
                        this.vy = (dy/r) * (20 + Math.random()*30);
                    }
                    this.x += this.vx; this.y += this.vy; 
                    this.vx *= 0.94; this.vy *= 0.94;
                    this.vx += (Math.random() - 0.5) * 0.5; this.vy -= Math.random() * 0.2;
                } else if (this.mode === 'fly') { 
                    this.vx = 0; this.vy = 0; // Don't float prior to explode, lie perfectly still simulating black screen
                } else if (this.mode === 'swarm') {
                    if (this.targetScale && this.targetScale < 0) return; // Behind camera
                    let dx = this.targetX! - this.x; let dy = this.targetY! - this.y; 
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    let speed = 0.03 + Math.random() * 0.05 + solidification * 0.15; 
                    if (stickmanZ < 0) speed = 1.0; // Instantly lock to bones when walking fast past camera
                    this.x += dx * speed; this.y += dy * speed;
                    this.size = this.baseSize * this.sizeMult * (this.targetScale || 1);
                }
            }
            draw() {
                if (!shatterTriggered) return;
                
                if (this.mode === 'swarm' && this.targetScale && this.targetScale < 0) return; // Cull if behind camera

                let alpha = 1; 
                if (solidification > 0.85) alpha = (1 - solidification) * 6.6;
                if (alpha > 1) alpha = 1;
                // Add extreme motion blur/trail during explode
                if (this.mode === 'explode') {
                    alpha = Math.min(1, Math.abs(this.vx) * 0.1 + 0.2);
                    ctx!.globalAlpha = alpha;
                    ctx!.beginPath(); ctx!.moveTo(this.x, this.y); ctx!.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
                    ctx!.lineWidth = this.size; ctx!.strokeStyle = '#000'; ctx!.stroke();
                } else {
                    if (alpha <= 0) return; 
                    ctx!.globalAlpha = alpha; ctx!.fillRect(this.x, this.y, this.size, this.size);
                }
            }
        }

        function handleResize() { width = window.innerWidth; height = window.innerHeight; canvas!.width = width; canvas!.height = height; }

        function init() {
            handleResize(); particles = Array.from({length: PARTICLE_COUNT}, () => new Particle());
        }

        let tempTextIndex = 0;
        function resetAndStart() {
            clearTimeout(narrativeTimeout);
            frame = 0; sceneState = 'narrative'; shatterTriggered = false; stickmanZ = 600; stickmanRotY = 0; solidification = 0; walkPhase = 0; tempTextIndex = 0; setCurrentTextIndex(0); activeTextRects = [];
            particles = Array.from({length: PARTICLE_COUNT}, () => new Particle()); // Re-init to scatter them
            startNarrative();
        }

        function startNarrative() {
            if (tempTextIndex < narrative.length) {
                setTimeout(() => { 
                    const el = document.getElementById(`s21-text-${tempTextIndex}`);
                    if (el) activeTextRects = [el.getBoundingClientRect()]; 
                }, 50);
                let delay = (tempTextIndex === 14) ? 5000 : 3200;
                narrativeTimeout = setTimeout(() => { 
                    activeTextRects = []; tempTextIndex++; setCurrentTextIndex(-1);
                    narrativeTimeout = setTimeout(() => { setCurrentTextIndex(tempTextIndex); startNarrative(); }, 1000); 
                }, delay);
            } else {
                sceneState = 'assemble'; particles.forEach(p => p.mode = 'swarm');
            }
        }

        function updateStickmanPhysics() {
            if (sceneState === 'assemble') { solidification = Math.min(1, solidification + 0.006); if (solidification >= 1) sceneState = 'walkout'; }
            if (sceneState === 'walkout') { walkPhase += 0.08; stickmanZ -= 4.0; } // Walk towards camera
            
            const stepCycle = walkPhase;
            const swayX = Math.sin(stepCycle) * 12;
            const swayY = Math.abs(Math.sin(stepCycle)) * 8;
            const tilt = Math.sin(stepCycle * 2) * 5;
            
            // 3D local coordinates
            let pPelvis = { x: swayX, y: 30 - swayY, z: -tilt };
            let pShoulders = { x: -swayX * 0.6, y: -45 - swayY, z: tilt };
            let pHead = { x: pShoulders.x, y: pShoulders.y - 30, z: pShoulders.z + 5 + Math.sin(stepCycle*2)*3 };
            
            let legSwing = Math.sin(stepCycle) * 45;
            let liftL = Math.max(0, -Math.cos(stepCycle)) * 30;
            let liftR = Math.max(0, Math.cos(stepCycle)) * 30;
            
            let kneeL = { x: pPelvis.x - 12, y: pPelvis.y + 35 - liftL*0.5, z: legSwing * 1.0 };
            let footL = { x: pPelvis.x - 12, y: pPelvis.y + 80 - liftL, z: legSwing * 1.5 };
            let kneeR = { x: pPelvis.x + 12, y: pPelvis.y + 35 - liftR*0.5, z: -legSwing * 1.0 };
            let footR = { x: pPelvis.x + 12, y: pPelvis.y + 80 - liftR, z: -legSwing * 1.5 };
            
            let armSwing = -legSwing * 0.9;
            let elbowL = { x: pShoulders.x - 22, y: pShoulders.y + 30, z: armSwing * 0.7 };
            let handL = { x: pShoulders.x - 28, y: pShoulders.y + 65, z: armSwing * 1.2 };
            let elbowR = { x: pShoulders.x + 22, y: pShoulders.y + 30, z: -armSwing * 0.7 };
            let handR = { x: pShoulders.x + 28, y: pShoulders.y + 65, z: -armSwing * 1.2 };

            let fov = 300;
            particles.forEach(p => {
                if (p.mode !== 'swarm') return;
                let lx = 0, ly = 0, lz = 0;
                if (p.type === 'head') { lx = pHead.x + p.ox; ly = pHead.y + p.oy; lz = pHead.z + p.oz; }
                else {
                    let n1, n2;
                    if (p.type === 'torso') { n1 = pShoulders; n2 = pPelvis; }
                    else if (p.type === 'legL') { n1 = p.t < 0.5 ? pPelvis : kneeL; n2 = p.t < 0.5 ? kneeL : footL; }
                    else if (p.type === 'legR') { n1 = p.t < 0.5 ? pPelvis : kneeR; n2 = p.t < 0.5 ? kneeR : footR; }
                    else if (p.type === 'armL') { n1 = p.t < 0.5 ? pShoulders : elbowL; n2 = p.t < 0.5 ? elbowL : handL; }
                    else if (p.type === 'armR') { n1 = p.t < 0.5 ? pShoulders : elbowR; n2 = p.t < 0.5 ? elbowR : handR; }
                    
                    let localT = (p.t % 0.5) * 2;
                    lx = n1!.x + localT * (n2!.x - n1!.x) + p.ox;
                    ly = n1!.y + localT * (n2!.y - n1!.y) + p.oy;
                    lz = n1!.z + localT * (n2!.z - n1!.z) + p.oz;
                }
                
                let globalZ = stickmanZ + lz;
                if (globalZ <= -fov) {
                    p.targetScale = -1; // hide it
                } else {
                    let scale = fov / (fov + globalZ);
                    p.targetX = width / 2 + lx * scale;
                    p.targetY = height / 2 + ly * scale;
                    p.targetScale = scale;
                }
            });
        }

        function drawVector() {
            // Replaced by perfectly formed true-3D particles
        }

        function loop() {
            if (activeRef.current) {
                frame++; 
                if (tempTextIndex >= 8 && !shatterTriggered) {
                    shatterTriggered = true;
                    particles.forEach(p => { 
                        p.mode = 'explode'; 
                        let dx = p.x - width/2; let dy = p.y - height/2; 
                        let r = Math.sqrt(dx*dx + dy*dy) || 1;
                        p.vx = (dx/r) * (20 + Math.random()*30); 
                        p.vy = (dy/r) * (20 + Math.random()*30); 
                    });
                }
                
                if (shatterTriggered) {
                    ctx!.fillStyle = '#fff'; ctx!.fillRect(0, 0, width, height); 
                } else {
                    ctx!.fillStyle = '#000'; ctx!.fillRect(0, 0, width, height);
                }
                
                if (sceneState !== 'narrative') updateStickmanPhysics();
                particles.forEach(p => { p.update(); p.draw(); });
            }
            animationFrameId = requestAnimationFrame(loop);
        }

        window.addEventListener('resize', handleResize);
        resetRef.current = () => resetAndStart();

        init(); loop();
        return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); clearTimeout(narrativeTimeout); };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-21">
            <div id="tc-21" className="z-10 relative">
                {narrative.map((text, i) => (
                    <div key={i} id={`s21-text-${i}`} dangerouslySetInnerHTML={{ __html: text }} className={`text-element-21 ${currentTextIndex === i ? 'active' : ''} ${i >= 8 ? 'text-dark' : ''}`} />
                ))}
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

export function Chapter22({ isActive }: { isActive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeRef = useRef(false);
    const resetRef = useRef<() => void>();
    const [uiVisible, setUiVisible] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let width = 0, height = 0; let particles: any[] = []; let pixels: any[] = []; const GRID_SIZE = 16; const PARTICLE_COUNT = 6000;
        const QUOTE = "I just wished that everyone knows how lucky they are to exist !";
        let mouse = { x: -1000, y: -1000, active: false }; let frame = 0; let uiTimeout: any;
        let animationFrameId: number;

        class Pixel {
            homeX: number; homeY: number; x: number; y: number; size: number;
            constructor(x: number, y: number) { this.homeX = x; this.homeY = y; this.x = x; this.y = y; this.size = 2; }
            update() {
                let dx = mouse.x - this.x; let dy = mouse.y - this.y; let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 120) { let force = (120 - dist) / 120; let angle = Math.atan2(dy, dx); this.x -= Math.cos(angle) * force * 20; this.y -= Math.sin(angle) * force * 20; }
                this.x += (this.homeX - this.x) * 0.08; this.y += (this.homeY - this.y) * 0.08;
            }
            draw() { ctx!.fillStyle = 'rgba(0,0,0,0.12)'; ctx!.fillRect(this.x, this.y, this.size, this.size); }
        }

        class DustParticle {
            x!: number; y!: number; targetX!: number; targetY!: number; vx!: number; vy!: number; size!: number; alpha!: number; isText!: boolean; friction!: number;
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * window.innerWidth; this.y = Math.random() * -window.innerHeight; this.targetX = this.x; this.targetY = this.y;
                this.vx = (Math.random() - 0.5) * 2; this.vy = Math.random() * 2 + 1; this.size = Math.random() * 2 + 0.5;
                this.alpha = 0; this.isText = false; this.friction = 0.95 + Math.random() * 0.04;
            }
            update() {
                if (!this.isText) { this.x += this.vx; this.y += this.vy; this.alpha = Math.min(1, this.alpha + 0.01); if (this.y > height) this.y = -20; }
                else { let dx = this.targetX - this.x; let dy = this.targetY - this.y; this.x += dx * 0.07; this.y += dy * 0.07; this.alpha = Math.min(1, this.alpha + 0.05); }
            }
            draw() { ctx!.globalAlpha = this.alpha; ctx!.fillStyle = '#000'; ctx!.fillRect(this.x, this.y, this.size, this.size); ctx!.globalAlpha = 1; }
        }

        function getTextPoints() {
            const tempCanvas = document.createElement('canvas'); const tempCtx = tempCanvas.getContext('2d')!;
            tempCanvas.width = width; tempCanvas.height = height; tempCtx.fillStyle = "#000"; tempCtx.font = "700 52px 'Caveat'"; tempCtx.textAlign = "center";
            const words = QUOTE.split(' '); let lines: string[] = []; let currentLine = ''; const maxWidth = width * 0.85;
            for(let n = 0; n < words.length; n++) {
                let testLine = currentLine + words[n] + ' '; let metrics = tempCtx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) { lines.push(currentLine); currentLine = words[n] + ' '; } else { currentLine = testLine; }
            }
            lines.push(currentLine);
            let startY = height / 2 - (lines.length * 30);
            lines.forEach((line, i) => { tempCtx.fillText(line.trim(), width/2, startY + (i * 70)); });
            const imageData = tempCtx.getImageData(0, 0, width, height).data; const points = [];
            for (let y = 0; y < height; y += 2) { for (let x = 0; x < width; x += 2) { if (imageData[(y * width + x) * 4 + 3] > 128) points.push({ x, y }); } }
            return points;
        }

        function init() {
            clearTimeout(uiTimeout); setUiVisible(false); mouse.x = -1000; mouse.y = -1000;
            width = window.innerWidth; height = window.innerHeight; canvas!.width = width; canvas!.height = height;
            pixels = []; for (let x = 0; x < width; x += GRID_SIZE) { for (let y = 0; y < height; y += GRID_SIZE) pixels.push(new Pixel(x, y)); }
            particles = Array.from({ length: PARTICLE_COUNT }, () => new DustParticle());
            uiTimeout = setTimeout(() => {
                const textPoints = getTextPoints();
                for (let i = 0; i < particles.length; i++) {
                    const point = textPoints[i % textPoints.length];
                    if (point) {
                        particles[i].targetX = point.x + (Math.random() - 0.5) * 2; particles[i].targetY = point.y + (Math.random() - 0.5) * 2; particles[i].isText = true;
                    }
                }
                uiTimeout = setTimeout(() => setUiVisible(true), 2500);
            }, 1000);
        }

        function loop() {
            if (activeRef.current) {
                ctx!.fillStyle = '#fff'; ctx!.fillRect(0, 0, width, height);
                pixels.forEach(p => { p.update(); p.draw(); }); particles.forEach(p => { p.update(); p.draw(); }); frame++;
            }
            animationFrameId = requestAnimationFrame(loop);
        }

        const handleInteraction = (e: any) => { const rect = canvas!.getBoundingClientRect(); mouse.x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left; mouse.y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top; };
        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('touchstart', (e) => { handleInteraction(e); }, {passive: false});
        window.addEventListener('touchmove', handleInteraction, {passive: false});
        window.addEventListener('resize', init);

        resetRef.current = () => init();

        init(); loop();

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('touchmove', handleInteraction);
            window.removeEventListener('resize', init);
            cancelAnimationFrame(animationFrameId); clearTimeout(uiTimeout);
        };
    }, []);

    useEffect(() => {
        if (isActive && !activeRef.current) { if (resetRef.current) resetRef.current(); }
        activeRef.current = isActive;
    }, [isActive]);

    return (
        <div className="section" id="sec-22">
            <div id="contact-ui" className={`z-10 relative ${uiVisible ? 'visible' : ''}`}>
                <div className="name">made by Navneet</div>
                <a href="https://instagram.com/oneinagoogolplex._" target="_blank" rel="noreferrer" className="insta">@oneinagoogolplex._</a>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0"></canvas>
        </div>
    );
}

