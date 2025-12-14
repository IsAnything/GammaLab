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
                <div class="gl-lightbox-media-container">
                    <img class="gl-lightbox-image" src="" alt="">
                    <video class="gl-lightbox-video" controls style="display: none; max-width: 100%; max-height: 80vh;"></video>
                </div>
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
        const lightboxVideo = lightbox.querySelector('.gl-lightbox-video');
        const lightboxCaption = lightbox.querySelector('.gl-lightbox-caption');
        const closeBtn = lightbox.querySelector('.gl-lightbox-close');
        const prevBtn = lightbox.querySelector('.gl-lightbox-prev');
        const nextBtn = lightbox.querySelector('.gl-lightbox-next');
        const overlay = lightbox.querySelector('.gl-lightbox-overlay');

        // Find all lightbox-enabled images AND videos
        const initLightbox = () => {
            // Target images in .card sections, exclude simulator canvases
            const images = document.querySelectorAll('.card img:not(.no-lightbox)');
            
            // Add images to list
            currentImages = Array.from(images).map(img => ({
                type: 'image',
                src: img.src,
                alt: img.alt || '',
                caption: img.nextElementSibling?.tagName === 'P' ? 
                         img.nextElementSibling.textContent : 
                         img.alt || ''
            }));

            // Add click handlers for images
            images.forEach((img, index) => {
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', (e) => {
                    if (!img.classList.contains('no-lightbox')) {
                        openLightbox(index);
                    }
                });
            });

            // Handle video triggers
            const videoTriggers = document.querySelectorAll('.video-trigger');
            videoTriggers.forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    const videoSrc = trigger.getAttribute('data-video-src');
                    const caption = trigger.getAttribute('data-caption') || '';
                    openVideoLightbox(videoSrc, caption);
                });
            });
        };

        // Open lightbox for images
        const openLightbox = (index) => {
            currentIndex = index;
            showMedia(currentImages[index]);
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        // Open lightbox for video (direct mode)
        const openVideoLightbox = (src, caption) => {
            showMedia({ type: 'video', src: src, caption: caption });
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Hide nav buttons for single video
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        };

        // Close lightbox
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            // Stop video if playing
            lightboxVideo.pause();
            lightboxVideo.currentTime = 0;
        };

        // Show current media (image or video)
        const showMedia = (mediaData) => {
            lightboxCaption.textContent = mediaData.caption;

            if (mediaData.type === 'video') {
                lightboxImg.style.display = 'none';
                lightboxVideo.style.display = 'block';
                lightboxVideo.src = mediaData.src;
                // Auto-play video when opened
                lightboxVideo.play().catch(e => console.log('Autoplay prevented:', e));
            } else {
                lightboxVideo.style.display = 'none';
                lightboxVideo.pause();
                lightboxImg.style.display = 'block';
                lightboxImg.src = mediaData.src;
                lightboxImg.alt = mediaData.alt;
                
                // Show/hide navigation buttons only for image gallery
                if (currentImages.length > 0) {
                    prevBtn.style.display = currentIndex > 0 ? 'block' : 'none';
                    nextBtn.style.display = currentIndex < currentImages.length - 1 ? 'block' : 'none';
                }
            }
        };

        // Navigation
        const showPrev = () => {
            if (currentIndex > 0) {
                currentIndex--;
                showMedia(currentImages[currentIndex]);
            }
        };

        const showNext = () => {
            if (currentIndex < currentImages.length - 1) {
                currentIndex++;
                showMedia(currentImages[currentIndex]);
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
