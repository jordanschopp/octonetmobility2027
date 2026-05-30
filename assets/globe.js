/**
 * OctoNet Mobility — Premium 3D Globe
 * Canvas-based globe with continent dots, rotating sphere,
 * glowing destination pins, animated connection arcs, and data packets.
 */
(function () {

  // ── DESTINATION PINS ─────────────────────────────────
  const DESTINATIONS = [
    { name: "Canada",         lat: 56,   lng: -96,  color: "#12c9ff", size: 5 },
    { name: "United States",  lat: 37,   lng: -95,  color: "#12c9ff", size: 6 },
    { name: "Europe",         lat: 51,   lng: 10,   color: "#12c9ff", size: 5 },
    { name: "Mexico",         lat: 23,   lng: -102, color: "#12c9ff", size: 4 },
    { name: "Caribbean",      lat: 18,   lng: -72,  color: "#12c9ff", size: 4 },
    { name: "Global",         lat: 2,    lng: 113,  color: "#0fcc8e", size: 4 },
    { name: "South America",  lat: -15,  lng: -55,  color: "#12c9ff", size: 4 },
  ];

  // ── ARC PAIRS ─────────────────────────────────────────
  const ARCS = [
    [0, 1], // Canada ↔ USA
    [1, 2], // USA ↔ Europe
    [1, 3], // USA ↔ Mexico
    [3, 4], // Mexico ↔ Caribbean
    [2, 5], // Europe ↔ Global
    [0, 6], // Canada ↔ South America
    [1, 6], // USA ↔ South America
    [5, 2], // Global ↔ Europe
  ];

  // ── SIMPLIFIED CONTINENT LAND MASK ───────────────────
  // Returns true if (lat, lng) is approximately over land
  function isLand(lat, lng) {
    const p = [lat, lng];

    // North America
    if (inBox(p, 25, 75, -170, -55)) {
      if (lat > 60 && lng < -140) return true; // Alaska
      if (lat > 48 && lng > -140 && lng < -55) return true;
      if (lat > 25 && lat < 50 && lng > -125 && lng < -60) return true;
      if (lat > 14 && lat < 32 && lng > -118 && lng < -86) return true; // Mexico
      if (lat > 7 && lat < 22 && lng > -90 && lng < -77) return true;  // Central Am
    }
    // Greenland
    if (inBox(p, 60, 84, -58, -17)) return true;

    // South America
    if (lat > -57 && lat < 13 && lng > -82 && lng < -34) return true;

    // Europe
    if (lat > 35 && lat < 72 && lng > -11 && lng < 40) return true;
    // Scandinavia extension
    if (lat > 57 && lat < 72 && lng > 4 && lng < 32) return true;
    // Iberian peninsula
    if (lat > 35 && lat < 44 && lng > -10 && lng < 4) return true;

    // Africa
    if (lat > -35 && lat < 38 && lng > -18 && lng < 52) {
      if (lat > 20 && lng > 35) return false; // Arabian peninsula cutout
      return true;
    }

    // Middle East / Arabian Peninsula
    if (lat > 12 && lat < 38 && lng > 35 && lng < 60) return true;

    // Russia / Central Asia
    if (lat > 50 && lat < 78 && lng > 30 && lng < 190) return true;
    if (lat > 35 && lat < 55 && lng > 50 && lng < 90) return true;

    // South / Southeast Asia
    if (lat > 5 && lat < 35 && lng > 65 && lng < 100) return true;
    if (lat > -10 && lat < 25 && lng > 95 && lng < 145) return true;

    // China / East Asia
    if (lat > 20 && lat < 55 && lng > 100 && lng < 145) return true;

    // Japan
    if (lat > 30 && lat < 45 && lng > 129 && lng < 146) return true;

    // Australia
    if (lat > -45 && lat < -10 && lng > 113 && lng < 154) return true;

    // New Zealand
    if (lat > -47 && lat < -34 && lng > 166 && lng < 178) return true;

    // Indonesia / Philippines
    if (lat > -10 && lat < 8 && lng > 95 && lng < 141) return true;

    // India / Sri Lanka
    if (lat > 6 && lat < 36 && lng > 68 && lng < 90) return true;

    return false;
  }

  function inBox(p, latMin, latMax, lngMin, lngMax) {
    return p[0] >= latMin && p[0] <= latMax && p[1] >= lngMin && p[1] <= lngMax;
  }

  // ── GENERATE CONTINENT POINTS ─────────────────────────
  function generateLandPoints(count) {
    const pts = [];
    let attempts = 0;
    const maxAttempts = count * 12;
    while (pts.length < count && attempts < maxAttempts) {
      attempts++;
      const lat = Math.random() * 170 - 85;
      const lng = Math.random() * 360 - 180;
      if (isLand(lat, lng)) pts.push([lat, lng]);
    }
    return pts;
  }

  // ── PROJECTION HELPERS ────────────────────────────────
  function latLngToXYZ(lat, lng, rotY) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lng + rotY) * Math.PI / 180;
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta),
    };
  }

  function project(xyz, cx, cy, r) {
    return { x: cx + xyz.x * r, y: cy - xyz.y * r, z: xyz.z };
  }

  // Great-circle interpolation
  function slerp(a, b, t) {
    const ax = latLngToXYZ(a[0], a[1], 0);
    const bx = latLngToXYZ(b[0], b[1], 0);
    const dot = Math.min(1, ax.x*bx.x + ax.y*bx.y + ax.z*bx.z);
    const omega = Math.acos(Math.max(-1, dot));
    if (Math.abs(omega) < 0.0001) return ax;
    const s = Math.sin(omega);
    const fa = Math.sin((1-t)*omega) / s;
    const fb = Math.sin(t*omega) / s;
    return { x: fa*ax.x+fb*bx.x, y: fa*ax.y+fb*bx.y, z: fa*ax.z+fb*bx.z };
  }

  // ── MAIN GLOBE CLASS ──────────────────────────────────
  class OctoGlobe {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx    = canvas.getContext('2d');
      this.rot    = 180; // start rotation
      this.rotSpeed = 0.12;
      this.paused  = false;
      this.hoveredDest = null;

      // Generate land points once
      this.landPoints = generateLandPoints(900);

      // Animated packets along arcs
      this.packets = ARCS.map((arc, i) => ({
        arc, t: (i / ARCS.length), speed: 0.002 + Math.random() * 0.002,
      }));

      // Pulse phase for destination pins
      this.pulse = 0;

      // Resize handler
      this._resize = () => this._setSize();
      window.addEventListener('resize', this._resize);
      this._setSize();

      // Hover
      canvas.addEventListener('mousemove', (e) => this._onMove(e));
      canvas.addEventListener('mouseleave', () => { this.paused = false; this.hoveredDest = null; });

      this._loop();
    }

    _setSize() {
      const parent = this.canvas.parentElement;
      const sz = Math.min(parent.offsetWidth, 520);
      this.canvas.width  = sz;
      this.canvas.height = sz;
      this.r  = sz * 0.40;
      this.cx = sz / 2;
      this.cy = sz / 2;
    }

    _onMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      this.hoveredDest = null;
      for (const d of DESTINATIONS) {
        const xyz = latLngToXYZ(d.lat, d.lng, this.rot);
        if (xyz.z < 0) continue;
        const p = project(xyz, this.cx, this.cy, this.r);
        const dx = mx - p.x, dy = my - p.y;
        if (Math.sqrt(dx*dx+dy*dy) < 14) {
          this.hoveredDest = d;
          this.paused = true;
          break;
        }
      }
      if (!this.hoveredDest) this.paused = false;
    }

    _loop() {
      this._frame = requestAnimationFrame(() => this._loop());
      if (!this.paused) this.rot += this.rotSpeed;
      this.pulse += 0.04;
      this.packets.forEach(p => { p.t += p.speed; if (p.t > 1) p.t -= 1; });
      this._draw();
    }

    _draw() {
      const { ctx, cx, cy, r, rot } = this;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // ── Atmosphere glow
      const atm = ctx.createRadialGradient(cx, cy, r*0.85, cx, cy, r*1.28);
      atm.addColorStop(0, 'rgba(0,140,255,0.14)');
      atm.addColorStop(0.5,'rgba(0,100,200,0.06)');
      atm.addColorStop(1, 'transparent');
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, r*1.28, 0, Math.PI*2);
      ctx.fill();

      // ── Globe base
      const base = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.05, cx, cy, r);
      base.addColorStop(0,   'rgba(10,40,80,0.95)');
      base.addColorStop(0.5, 'rgba(5,20,45,0.97)');
      base.addColorStop(1,   'rgba(2,10,25,0.99)');
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fill();

      // ── Globe border
      ctx.strokeStyle = 'rgba(18,201,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Latitude rings (subtle)
      ctx.save();
      ctx.strokeStyle = 'rgba(18,201,255,0.06)';
      ctx.lineWidth = 0.5;
      [-45,-23,0,23,45].forEach(lat => {
        const phi = (90-lat)*Math.PI/180;
        const ry  = Math.abs(Math.cos(phi));
        const py  = cy - Math.cos(phi)*r;
        const rx  = Math.sin(phi)*r;
        ctx.beginPath();
        ctx.ellipse(cx, py, rx, rx*0.15, 0, 0, Math.PI*2);
        ctx.stroke();
      });
      ctx.restore();

      // ── Land dots
      this.landPoints.forEach(([lat, lng]) => {
        const xyz = latLngToXYZ(lat, lng, rot);
        if (xyz.z < -0.1) return; // back hemisphere
        const p   = project(xyz, cx, cy, r);
        const vis = Math.max(0, xyz.z);          // 0-1 visibility
        const sz  = 0.9 + vis * 0.8;
        const alpha = 0.25 + vis * 0.55;

        // Edge tint — more cyan near edges
        const edgeness = 1 - vis;
        const blue = Math.round(180 + edgeness*75);
        ctx.fillStyle = `rgba(${Math.round(100+vis*50)},${Math.round(180+vis*40)},${blue},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI*2);
        ctx.fill();
      });

      // ── Connection arcs
      ARCS.forEach(([ai, bi]) => {
        const a = DESTINATIONS[ai];
        const b = DESTINATIONS[bi];
        this._drawArc(a.lat, a.lng, b.lat, b.lng, 'rgba(18,201,255,0.18)', 1);
      });

      // ── Animated packets
      this.packets.forEach(({ arc, t }) => {
        const a = DESTINATIONS[arc[0]];
        const b = DESTINATIONS[arc[1]];
        this._drawPacket(a.lat, a.lng, b.lat, b.lng, t);
      });

      // ── Destination pins
      DESTINATIONS.forEach(d => {
        const xyz = latLngToXYZ(d.lat, d.lng, rot);
        if (xyz.z < 0) return;
        const p   = project(xyz, cx, cy, r);
        const vis = Math.max(0, xyz.z);
        const isHovered = this.hoveredDest === d;

        // Ripple rings
        const rings = isHovered ? 3 : 2;
        for (let i = 0; i < rings; i++) {
          const phase = (this.pulse * 0.7 + i * 0.8) % (Math.PI * 2);
          const ripR  = d.size * (2 + Math.sin(phase) * 3 + i*4);
          const ripA  = (0.4 - i*0.12) * vis * (isHovered ? 1.4 : 1);
          ctx.strokeStyle = `rgba(18,201,255,${Math.max(0,ripA)})`;
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0, ripR), 0, Math.PI*2);
          ctx.stroke();
        }

        // Pin glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, d.size*4);
        glow.addColorStop(0, `rgba(18,201,255,${0.5*vis})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, d.size*4, 0, Math.PI*2);
        ctx.fill();

        // Pin dot
        ctx.fillStyle = isHovered ? '#fff' : d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur  = isHovered ? 16 : 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, d.size * (isHovered ? 1.4 : 1) * vis, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label on hover
        if (isHovered) {
          const pad = 8, fh = 13;
          ctx.font = `700 ${fh}px "Barlow", sans-serif`;
          const tw = ctx.measureText(d.name).width;
          const lx = p.x + 14, ly = p.y - 8;
          ctx.fillStyle = 'rgba(7,20,38,0.88)';
          ctx.beginPath();
          ctx.roundRect(lx-pad, ly-fh, tw+pad*2, fh+pad, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(18,201,255,0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#12c9ff';
          ctx.fillText(d.name, lx, ly-1);
        }
      });

      // ── Specular highlight
      const spec = ctx.createRadialGradient(cx-r*0.35, cy-r*0.38, 0, cx-r*0.2, cy-r*0.2, r*0.65);
      spec.addColorStop(0,   'rgba(200,240,255,0.07)');
      spec.addColorStop(0.4, 'rgba(100,200,255,0.03)');
      spec.addColorStop(1,   'transparent');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fill();
    }

    _drawArc(lat1, lng1, lat2, lng2, color, width) {
      const { ctx, cx, cy, r, rot } = this;
      const steps  = 60;
      const points = [];

      for (let i = 0; i <= steps; i++) {
        const t   = i / steps;
        const xyz = slerp([lat1,lng1],[lat2,lng2], t);
        // Apply globe rotation
        const theta = rot * Math.PI / 180;
        const rx = xyz.x*Math.cos(theta) - xyz.z*Math.sin(theta);
        const rz = xyz.x*Math.sin(theta) + xyz.z*Math.cos(theta);
        const ry = xyz.y;
        points.push({ x: cx+rx*r, y: cy-ry*r, z: rz });
      }

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = width;
      ctx.lineCap     = 'round';

      let drawing = false;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (p.z < 0) { drawing = false; return; }
        if (!drawing) { ctx.moveTo(p.x, p.y); drawing = true; }
        else           { ctx.lineTo(p.x, p.y); }
      });
      ctx.stroke();
      ctx.restore();
    }

    _drawPacket(lat1, lng1, lat2, lng2, t) {
      const { ctx, cx, cy, r, rot } = this;
      const xyz   = slerp([lat1,lng1],[lat2,lng2], t);
      const theta = rot * Math.PI / 180;
      const rx = xyz.x*Math.cos(theta) - xyz.z*Math.sin(theta);
      const rz = xyz.x*Math.sin(theta) + xyz.z*Math.cos(theta);
      const ry = xyz.y;
      if (rz < 0) return;

      const px = cx+rx*r, py = cy-ry*r;
      const vis = Math.max(0, rz);

      // Glow
      const g = ctx.createRadialGradient(px,py,0,px,py,7);
      g.addColorStop(0, `rgba(18,201,255,${0.9*vis})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI*2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = `rgba(255,255,255,${vis})`;
      ctx.shadowColor = '#12c9ff';
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    destroy() {
      cancelAnimationFrame(this._frame);
      window.removeEventListener('resize', this._resize);
    }
  }

  // ── INIT ─────────────────────────────────────────────
  function init() {
    const existing = document.getElementById('globe-v2');
    if (!existing) return;

    // Replace the old globe div with a canvas wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'globe-v2';
    wrapper.style.cssText = existing.style.cssText +
      ';position:absolute;right:5%;top:4%;width:min(500px,44vw);height:min(500px,44vw);';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    wrapper.appendChild(canvas);
    existing.replaceWith(wrapper);

    // Remove old SVG and dots from previous globe
    const oldSvg  = document.getElementById('globe-svg');
    const oldDots = document.querySelectorAll('.globe-dot');
    if (oldSvg)  oldSvg.remove();
    oldDots.forEach(d => d.remove());

    window._octoGlobe = new OctoGlobe(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
