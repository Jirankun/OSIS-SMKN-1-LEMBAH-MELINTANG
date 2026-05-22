    // Smart back button: supports normal navigation + new tab (target="_blank")
    document.querySelector('.back-btn').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Try 1: Go back in history if available
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        
        // Try 2: Close the tab if it was opened via target="_blank" or window.open()
        // Note: window.close() only works for windows/tabs opened by script
        if (window.opener || window.name === '_blank') {
            try {
                window.close();
                // Fallback if close() is blocked by browser
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
                return;
            } catch (err) {
                console.warn('window.close() blocked, falling back to redirect');
            }
        }
        
        // Try 3: Fallback to referrer if it's from the same domain
        const referrer = document.referrer;
        if (referrer && referrer.includes('smkn1-osis.pages.dev')) {
            window.location.href = referrer;
            return;
        }
        
        // Final fallback: Go to homepage
        window.location.href = '/';
    });

    // Add keyboard navigation support for back button
    document.querySelector('.back-btn').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Optional: Add visual feedback when back button is clicked
    document.querySelector('.back-btn').addEventListener('mousedown', function() {
        this.style.transform = 'translateX(-3px) scale(0.98)';
    });
    
    document.querySelector('.back-btn').addEventListener('mouseup', function() {
        this.style.transform = '';
    });
    
    document.querySelector('.back-btn').addEventListener('mouseleave', function() {
        this.style.transform = '';
    });