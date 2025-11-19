const fs = require('fs-extra');
const { minify } = require('terser');
const path = require('path');

async function build() {
    console.log('🚀 Iniciando build...');

    const srcDir = '.';
    const distDir = 'dist';

    // 1. Limpiar y crear dist
    await fs.emptyDir(distDir);
    console.log('✓ Directorio dist limpio');

    // 2. Copiar todo excepto JS y archivos no deseados
    const itemsToCopy = await fs.readdir(srcDir);

    for (const item of itemsToCopy) {
        // Saltar archivos/carpetas que no queremos copiar
        if (['node_modules', 'dist', 'package.json', 'package-lock.json', 'build.js'].includes(item)) {
            continue;
        }

        const srcPath = path.join(srcDir, item);
        const destPath = path.join(distDir, item);

        await fs.copy(srcPath, destPath, {
            filter: (src) => {
                // No copiar archivos JS originales (excepto luxon.min.js)
                if (src.endsWith('.js') && !src.includes('luxon.min.js')) {
                    return false;
                }
                return true;
            }
        });
    }
    console.log('✓ Archivos HTML, CSS e imágenes copiados');

    // 3. Minificar y ofuscar archivos JS
    const jsFiles = ['assets/scripts/script.js', 'assets/scripts/download.js'];

    for (const file of jsFiles) {
        const inputPath = path.join(srcDir, file);
        const outputPath = path.join(distDir, file);

        if (await fs.pathExists(inputPath)) {
            const code = await fs.readFile(inputPath, 'utf8');
            const result = await minify(code, {
                compress: {
                    dead_code: true,
                    drop_console: false,
                    drop_debugger: true,
                    passes: 3,  // Más pasadas de optimización
                    unsafe: true,  // Optimizaciones más agresivas
                    unsafe_comps: true,
                    unsafe_math: true,
                    unsafe_methods: true
                },
                mangle: {
                    toplevel: true,
                    properties: {
                        // Ofusca propiedades que no sean públicas
                        regex: /^_/  // Solo ofusca propiedades que empiecen con _
                    }
                },  
                format: {
                    comments: false,
                    ascii_only: true  // Convierte caracteres especiales a ASCII
                }
            });

            if (result.code) {
                await fs.outputFile(outputPath, result.code);
                console.log(`✓ ${file} minificado`);
            }
        }
    }

    console.log('✅ Build completado exitosamente!');
}

build().catch(err => {
    console.error('❌ Error en build:', err);
    process.exit(1);
});