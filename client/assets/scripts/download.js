// ===========================================
// DESCARGA DE APK
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // ===================================================
            // CONFIGURACIÓN DE DESCARGA
            // ===================================================
            // Reemplaza esta URL con la URL real de tu APK
            // Ejemplos:
            // - GitHub Releases: 'https://github.com/usuario/repo/releases/download/v1.0.0/devoleatv.apk'
            // - Firebase Storage: 'https://firebasestorage.googleapis.com/...'
            // - Google Drive: URL directa de descarga
            // - Tu servidor: 'https://tudominio.com/descargas/devoleatv.apk'
            
            const apkUrl = 'TU_URL_DE_DESCARGA_AQUI';
            
            // ===================================================
            // INICIAR DESCARGA
            // ===================================================
            if (apkUrl !== 'TU_URL_DE_DESCARGA_AQUI') {
                // Cambiar texto del botón durante la descarga
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = `
                    <svg class="download-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Descargando...
                `;
                
                // Iniciar descarga
                window.location.href = apkUrl;
                
                // Restaurar texto del botón después de 3 segundos
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                }, 3000);
                
                // Mostrar instrucciones después de iniciar descarga
                setTimeout(() => {
                    showDownloadInstructions();
                }, 1000);
            } else {
                // Si no está configurada la URL, mostrar alerta
                alert('¡Descarga iniciada! Por favor espera mientras se descarga el archivo (180 MB).\n\nNota: Configura la URL de descarga en download.js');
            }
        });
    }
});

// ===========================================
// MOSTRAR INSTRUCCIONES POST-DESCARGA
// ===========================================
function showDownloadInstructions() {
    // Scroll suave a la sección de instalación
    const installSection = document.querySelector('.installation');
    if (installSection) {
        installSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// ===========================================
// ANALYTICS (OPCIONAL)
// ===========================================
// Si usas Google Analytics, puedes trackear las descargas:
/*
function trackDownload() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'download', {
            'event_category': 'APK',
            'event_label': 'DeVoleaTV Android App',
            'value': 1
        });
    }
}
*/