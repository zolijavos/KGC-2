#!/usr/bin/env node
/**
 * Excalidraw to SVG Converter
 * Converts .excalidraw JSON files to embeddable SVG
 *
 * Usage: node convert-to-svg.js <input.excalidraw> [output.svg]
 */

const fs = require('fs');
const path = require('path');

function escapeXml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function convertExcalidrawToSvg(excalidrawData) {
    const elements = excalidrawData.elements || [];

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
        if (el.isDeleted) return;
        const x = el.x || 0;
        const y = el.y || 0;
        const w = el.width || 0;
        const h = el.height || 0;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);

        // Handle arrows with points
        if (el.points) {
            el.points.forEach(p => {
                minX = Math.min(minX, x + p[0]);
                minY = Math.min(minY, y + p[1]);
                maxX = Math.max(maxX, x + p[0]);
                maxY = Math.max(maxY, y + p[1]);
            });
        }
    });

    // Add padding
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    let svgContent = [];

    // SVG header
    svgContent.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" class="w-full h-auto">`);
    svgContent.push('<defs>');
    svgContent.push('<style>.excalidraw-text { font-family: Segoe UI, Arial, sans-serif; }</style>');
    // Dynamic arrowhead markers - will be created per stroke color
    svgContent.push('<marker id="ah" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">');
    svgContent.push('<polygon points="0 0, 12 4, 0 8" fill="#1e1e1e"/>');
    svgContent.push('</marker>');
    svgContent.push('<marker id="ah-blue" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">');
    svgContent.push('<polygon points="0 0, 12 4, 0 8" fill="#1976d2"/>');
    svgContent.push('</marker>');
    svgContent.push('<marker id="ah-green" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">');
    svgContent.push('<polygon points="0 0, 12 4, 0 8" fill="#388e3c"/>');
    svgContent.push('</marker>');
    svgContent.push('<marker id="ah-orange" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">');
    svgContent.push('<polygon points="0 0, 12 4, 0 8" fill="#f57c00"/>');
    svgContent.push('</marker>');
    svgContent.push('</defs>');

    // Background
    const bgColor = excalidrawData.appState?.viewBackgroundColor || '#ffffff';
    svgContent.push(`<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${bgColor}"/>`);

    // Render elements
    elements.forEach(el => {
        if (el.isDeleted) return;

        const x = el.x || 0;
        const y = el.y || 0;
        const w = el.width || 100;
        const h = el.height || 50;
        const stroke = el.strokeColor || '#1e1e1e';
        const fill = el.backgroundColor || 'transparent';
        const strokeWidth = el.strokeWidth || 1;
        const opacity = (el.opacity || 100) / 100;

        switch (el.type) {
            case 'rectangle':
                const rx = el.roundness?.value || 0;
                svgContent.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" rx="${rx}" opacity="${opacity}"/>`);
                break;

            case 'ellipse':
                const cx = x + w / 2;
                const cy = y + h / 2;
                const radiusX = w / 2;
                const radiusY = h / 2;
                svgContent.push(`<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
                break;

            case 'diamond':
                const dx = x + w / 2;
                const dy = y;
                const points = `${dx},${dy} ${x + w},${y + h / 2} ${dx},${y + h} ${x},${y + h / 2}`;
                svgContent.push(`<polygon points="${points}" stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
                break;

            case 'arrow':
            case 'line':
                if (el.points && el.points.length >= 2) {
                    const pathData = el.points.map((p, i) => {
                        const cmd = i === 0 ? 'M' : 'L';
                        return `${cmd} ${x + p[0]} ${y + p[1]}`;
                    }).join(' ');

                    // Add arrowhead for arrow type (always, unless explicitly disabled)
                    let markerEnd = '';
                    if (el.type === 'arrow' && el.endArrowhead !== 'none') {
                        // Select marker color based on stroke
                        let markerId = 'ah';
                        if (stroke === '#1976d2' || stroke.toLowerCase() === '#1976d2') markerId = 'ah-blue';
                        else if (stroke === '#388e3c' || stroke.toLowerCase() === '#388e3c') markerId = 'ah-green';
                        else if (stroke === '#f57c00' || stroke.toLowerCase() === '#f57c00') markerId = 'ah-orange';
                        markerEnd = ` marker-end="url(#${markerId})"`;
                    }
                    svgContent.push(`<path d="${pathData}" stroke="${stroke}" fill="none" stroke-width="${strokeWidth}"${markerEnd} opacity="${opacity}"/>`);
                }
                break;

            case 'text':
                const fontSize = el.fontSize || 16;
                const textAlign = el.textAlign || 'left';
                const text = el.text || '';
                const lines = text.split('\n');
                const lineHeight = fontSize * 1.2;

                let textX = x;
                let anchor = 'start';
                if (textAlign === 'center') {
                    textX = x + w / 2;
                    anchor = 'middle';
                } else if (textAlign === 'right') {
                    textX = x + w;
                    anchor = 'end';
                }

                lines.forEach((line, i) => {
                    const textY = y + fontSize + (i * lineHeight);
                    svgContent.push(`<text x="${textX}" y="${textY}" font-size="${fontSize}" fill="${stroke}" text-anchor="${anchor}" class="excalidraw-text" opacity="${opacity}">${escapeXml(line)}</text>`);
                });
                break;
        }
    });

    svgContent.push('</svg>');

    return svgContent.join('\n');
}

// Main execution
if (process.argv.length < 3) {
    console.log('Usage: node convert-to-svg.js <input.excalidraw> [output.svg]');
    console.log('       node convert-to-svg.js --batch <directory>');
    process.exit(1);
}

const arg1 = process.argv[2];

if (arg1 === '--batch') {
    // Batch mode: convert all .excalidraw files in directory
    const dir = process.argv[3] || '.';
    const pattern = process.argv[4] || '*.excalidraw';

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.excalidraw'));

    console.log(`Found ${files.length} excalidraw files in ${dir}`);

    files.forEach(file => {
        const inputPath = path.join(dir, file);
        const outputPath = path.join(dir, file.replace('.excalidraw', '.svg'));

        try {
            const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
            const svg = convertExcalidrawToSvg(data);
            fs.writeFileSync(outputPath, svg);
            console.log(`✓ ${file} -> ${path.basename(outputPath)}`);
        } catch (err) {
            console.error(`✗ ${file}: ${err.message}`);
        }
    });
} else {
    // Single file mode
    const inputPath = arg1;
    const outputPath = process.argv[3] || inputPath.replace('.excalidraw', '.svg');

    try {
        const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        const svg = convertExcalidrawToSvg(data);
        fs.writeFileSync(outputPath, svg);
        console.log(`✓ Converted: ${inputPath} -> ${outputPath}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { convertExcalidrawToSvg };
