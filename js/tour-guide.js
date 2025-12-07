class TourGuide {
    constructor(steps) {
        this.steps = steps;
        this.currentStepIndex = 0;
        this.isActive = false;
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Create Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        document.body.appendChild(this.overlay);

        // Create Spotlight
        this.spotlight = document.createElement('div');
        this.spotlight.className = 'tour-spotlight';
        document.body.appendChild(this.spotlight);

        // Create Tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tour-tooltip';
        this.tooltip.innerHTML = `
            <h3 id="tour-title">Title</h3>
            <p id="tour-desc">Description</p>
            <div class="tour-controls">
                <span id="tour-step-count" class="tour-step-indicator">1/5</span>
                <div>
                    <button id="tour-skip-btn" class="tour-btn tour-btn-skip">Salta</button>
                    <button id="tour-next-btn" class="tour-btn tour-btn-next">Avanti</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.tooltip);

        // Cache tooltip elements
        this.titleEl = this.tooltip.querySelector('#tour-title');
        this.descEl = this.tooltip.querySelector('#tour-desc');
        this.stepCountEl = this.tooltip.querySelector('#tour-step-count');
        this.nextBtn = this.tooltip.querySelector('#tour-next-btn');
        this.skipBtn = this.tooltip.querySelector('#tour-skip-btn');
    }

    bindEvents() {
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.skipBtn.addEventListener('click', () => this.endTour());
        
        // Optional: Close on overlay click? Maybe not to prevent accidental closes
        // this.overlay.addEventListener('click', () => this.endTour());
        
        // Handle window resize to adjust spotlight
        window.addEventListener('resize', () => {
            if (this.isActive) {
                this.updateSpotlightPosition();
            }
        });
    }

    start() {
        if (!this.steps || this.steps.length === 0) return;
        
        this.isActive = true;
        this.currentStepIndex = 0;
        this.overlay.classList.add('active');
        this.showStep(0);
    }

    showStep(index) {
        const step = this.steps[index];
        const targetEl = document.querySelector(step.target);

        if (!targetEl) {
            console.warn(`Tour target not found: ${step.target}`);
            this.nextStep(); // Skip if element missing
            return;
        }

        // Scroll to element
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Update Tooltip Content
        this.titleEl.textContent = step.title;
        this.descEl.textContent = step.description;
        this.stepCountEl.textContent = `${index + 1} / ${this.steps.length}`;
        this.nextBtn.textContent = index === this.steps.length - 1 ? 'Finito!' : 'Avanti';

        // Position Spotlight & Tooltip after a small delay to allow scroll to finish
        setTimeout(() => {
            this.positionSpotlight(targetEl);
            this.positionTooltip(targetEl, step.placement || 'bottom');
            this.tooltip.classList.add('visible');
        }, 400);
    }

    positionSpotlight(element) {
        const rect = element.getBoundingClientRect();
        const padding = 10; // Padding around the element

        // Adjust for scroll
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        this.spotlight.style.width = `${rect.width + padding * 2}px`;
        this.spotlight.style.height = `${rect.height + padding * 2}px`;
        this.spotlight.style.top = `${rect.top + scrollTop - padding}px`;
        this.spotlight.style.left = `${rect.left + scrollLeft - padding}px`;
    }

    updateSpotlightPosition() {
        const step = this.steps[this.currentStepIndex];
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            this.positionSpotlight(targetEl);
            this.positionTooltip(targetEl, step.placement || 'bottom');
        }
    }

    positionTooltip(targetEl, placement) {
        const targetRect = targetEl.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const spacing = 20;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let top, left;

        // Simple positioning logic
        if (placement === 'bottom') {
            top = targetRect.bottom + scrollTop + spacing;
            left = targetRect.left + scrollLeft + (targetRect.width / 2) - (tooltipRect.width / 2);
        } else if (placement === 'top') {
            top = targetRect.top + scrollTop - tooltipRect.height - spacing;
            left = targetRect.left + scrollLeft + (targetRect.width / 2) - (tooltipRect.width / 2);
        } else if (placement === 'right') {
            top = targetRect.top + scrollTop + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.right + scrollLeft + spacing;
        } else if (placement === 'left') {
            top = targetRect.top + scrollTop + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.left + scrollLeft - tooltipRect.width - spacing;
        }

        // Boundary checks (keep on screen)
        const maxLeft = document.documentElement.clientWidth - tooltipRect.width - 20;
        left = Math.max(20, Math.min(left, maxLeft));

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }

    nextStep() {
        this.tooltip.classList.remove('visible');
        
        this.currentStepIndex++;
        if (this.currentStepIndex < this.steps.length) {
            this.showStep(this.currentStepIndex);
        } else {
            this.endTour();
        }
    }

    endTour() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('visible');
        
        // Move spotlight offscreen
        this.spotlight.style.top = '-9999px';
        this.spotlight.style.left = '-9999px';
        
        // Optional callback
        if (this.onComplete) this.onComplete();
    }
}
