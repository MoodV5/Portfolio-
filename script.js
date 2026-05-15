document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map-container');
    const map = document.getElementById('map');
    
    // Modal elements
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal');

    // Map State
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    function getMinScale() {
        return Math.max(window.innerWidth / 2000, window.innerHeight / 2000);
    }

    let scale = Math.max(1, getMinScale());
    const MAX_SCALE = 3.0;

    // Center the map initially based on scale
    let translateX = (window.innerWidth - 2000 * scale) / 2;
    let translateY = (window.innerHeight - 2000 * scale) / 2;
    let currentTranslateX = translateX;
    let currentTranslateY = translateY;

    function updateMapTransform() {
        const mapWidth = 2000 * scale;
        const mapHeight = 2000 * scale;
        
        let maxTranslateX = 0;
        let maxTranslateY = 0;
        let minTranslateX = window.innerWidth - mapWidth;
        let minTranslateY = window.innerHeight - mapHeight;

        // If scaled map is smaller than window, center it
        if (mapWidth < window.innerWidth) {
            minTranslateX = (window.innerWidth - mapWidth) / 2;
            maxTranslateX = minTranslateX;
        }
        if (mapHeight < window.innerHeight) {
            minTranslateY = (window.innerHeight - mapHeight) / 2;
            maxTranslateY = minTranslateY;
        }

        currentTranslateX = Math.min(maxTranslateX, Math.max(minTranslateX, currentTranslateX));
        currentTranslateY = Math.min(maxTranslateY, Math.max(minTranslateY, currentTranslateY));

        map.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${scale})`;
        map.style.setProperty('--inverse-scale', 1 / scale);
    }

    // Initialize position
    updateMapTransform();
    // After mount, update translateX/Y to the bounded values
    translateX = currentTranslateX;
    translateY = currentTranslateY;

    // Drag events
    mapContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        currentTranslateX = translateX + deltaX;
        currentTranslateY = translateY + deltaY;

        updateMapTransform();
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        translateX = currentTranslateX;
        translateY = currentTranslateY;
    });
    
    window.addEventListener('mouseleave', () => {
        if (!isDragging) return;
        isDragging = false;
        translateX = currentTranslateX;
        translateY = currentTranslateY;
    });

    // Touch support for mobile
    mapContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // prevent native scroll
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;

        currentTranslateX = translateX + deltaX;
        currentTranslateY = translateY + deltaY;
        
        updateMapTransform();
    }, { passive: false });

    window.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        translateX = currentTranslateX;
        translateY = currentTranslateY;
    });

    // Handle Window Resize
    window.addEventListener('resize', () => {
        const minScale = getMinScale();
        if (scale < minScale) {
            scale = minScale;
            // Recenter if scale was forced to change
            currentTranslateX = (window.innerWidth - 2000 * scale) / 2;
            currentTranslateY = (window.innerHeight - 2000 * scale) / 2;
        }
        updateMapTransform();
        translateX = currentTranslateX;
        translateY = currentTranslateY;
    });

    // Zoom event
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomFactor = 0.1;
        const delta = e.deltaY < 0 ? 1 : -1;
        
        let newScale = scale * (1 + delta * zoomFactor);
        const minScale = getMinScale();
        newScale = Math.min(Math.max(minScale, newScale), MAX_SCALE);
        
        if (newScale === scale) return;
        
        const rect = mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate new translations to zoom into the cursor
        currentTranslateX = mouseX - ((mouseX - currentTranslateX) / scale) * newScale;
        currentTranslateY = mouseY - ((mouseY - currentTranslateY) / scale) * newScale;
        
        scale = newScale;
        translateX = currentTranslateX;
        translateY = currentTranslateY;
        
        updateMapTransform();
    }, { passive: false });

    // Landmarks click handling
    const landmarks = document.querySelectorAll('.landmark');
    
    landmarks.forEach(landmark => {
        landmark.addEventListener('mousedown', (e) => {
            // Stop propagation so we don't start dragging the map
            e.stopPropagation();
        });
        landmark.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
        
        landmark.addEventListener('click', (e) => {
            e.stopPropagation(); // ensure it doesn't bubble up to drag
            const targetId = landmark.getAttribute('data-target');
            const template = document.getElementById(`tpl-${targetId}`);
            if (template) {
                modalContent.innerHTML = template.innerHTML;
                openModal();
            }
        });
    });

    function openModal() {
        modal.classList.remove('hidden');
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        modalOverlay.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});
