window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===========================================
// DESCARGA DE APK (versión optimizada)
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');

    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // ===================================================
        // CONFIGURACIÓN DE DESCARGA
        // ===================================================
        // URL directa desde GitHub Releases
        
        const apkUrl = 'https://github.com/mooydev/devoleatv-releases/releases/latest/download/devoleatv-app-release_v_1_0_0.apk';

        // ===================================================
        // EFECTO DE DESCARGA (UX)
        // ===================================================
        const originalHTML = downloadBtn.innerHTML;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Descargando...
        `;

        // Iniciar descarga
        try {
            window.location.href = apkUrl;
        } catch (error) {
            console.error('Error iniciando descarga:', error);
            alert('❌ Ocurrió un problema al iniciar la descarga. Inténtalo nuevamente.');
        }

        // Restaurar botón después de unos segundos
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalHTML;
        }, 4000);

        // Mostrar instrucciones después de iniciar descarga
        setTimeout(showDownloadInstructions, 1000);
    });
});

// ===========================================
// MOSTRAR INSTRUCCIONES POST-DESCARGA
// ===========================================
function showDownloadInstructions() {
    const installSection = document.querySelector('.installation');
    if (installSection) {
        installSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
