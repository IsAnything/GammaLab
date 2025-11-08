/**
 * GAMMALAB - Lightbox Module
 * Simple image lightbox/modal for click-to-enlarge functionality
 */

(function() {
    'use strict';

    // Create lightbox structure
    const lightboxHTML = `
        <div id="gl-lightbox" class="gl-lightbox">
            <div class="gl-lightbox-overlay"></div>
            <div class="gl-lightbox-content">
                <button class="gl-lightbox-close" aria-label="Close">&times;</button>
                <button class="gl-lightbox-prev" aria-label="Previous">‹</button>
                <button class="gl-lightbox-next" aria-label="Next">›</button>
                <img class="gl-lightbox-image" src="" alt="">
                <div class="gl-lightbox-caption"></div>
            </div>
        </div>
    `;

    let currentImages = [];
    let currentIndex = 0;

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Insert lightbox HTML
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        const lightbox = document.getElementById('gl-lightbox');
        const lightboxImg = lightbox.querySelector('.gl-lightbox-image');
        const lightboxCaption = lightbox.querySelector('.gl-lightbox-caption');
        const closeBtn = lightbox.querySelector('.gl-lightbox-close');
        const prevBtn = lightbox.querySelector('.gl-lightbox-prev');
        const nextBtn = lightbox.querySelector('.gl-lightbox-next');
        const overlay = lightbox.querySelector('.gl-lightbox-overlay');

        // Find all lightbox-enabled images
        const initLightbox = () => {
            // Target images in .card sections, exclude simulator canvases
            const images = document.querySelectorAll('.card img:not(.no-lightbox)');
            
            currentImages = Array.from(images).map(img => ({
                src: img.src,
                alt: img.alt || '',
                caption: img.nextElementSibling?.tagName === 'P' ? 
                         img.nextElementSibling.textContent : 
                         img.alt || ''
            }));

            // Add click handlers
            images.forEach((img, index) => {
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', (e) => {
                    if (!img.classList.contains('no-lightbox')) {
                        openLightbox(index);
                    }
                });
            });
        };

        // Open lightbox
        const openLightbox = (index) => {
            currentIndex = index;
            showImage();
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        // Close lightbox
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Show current image
        const showImage = () => {
            const imageData = currentImages[currentIndex];
            lightboxImg.src = imageData.src;
            lightboxImg.alt = imageData.alt;
            lightboxCaption.textContent = imageData.caption;

            // Show/hide navigation buttons
            prevBtn.style.display = currentIndex > 0 ? 'block' : 'none';
            nextBtn.style.display = currentIndex < currentImages.length - 1 ? 'block' : 'none';
        };

        // Navigation
        const showPrev = () => {
            if (currentIndex > 0) {
                currentIndex--;
                showImage();
            }
        };

        const showNext = () => {
            if (currentIndex < currentImages.length - 1) {
                currentIndex++;
                showImage();
            }
        };

        // Event listeners
        closeBtn.addEventListener('click', closeLightbox);
        overlay.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', showPrev);
        nextBtn.addEventListener('click', showNext);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;

            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    showPrev();
                    break;
                case 'ArrowRight':
                    showNext();
                    break;
            }
        });

        // Initialize
        initLightbox();

        console.log(`✨ Lightbox inizializzato: ${currentImages.length} immagini trovate`);
    });
})();
