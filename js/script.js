document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- 2. Copy IP Button & Toast ---
    const copyBtns = document.querySelectorAll('.copy-ip-btn');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = 'IP Copied to Clipboard!';
    document.body.appendChild(toast);

    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const ip = btn.getAttribute('data-ip');
            navigator.clipboard.writeText(ip).then(() => {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
                
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.style.background = '#3ddc84';
                btn.style.color = '#000';
                btn.style.borderColor = '#3ddc84';
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 2000);
            });
        });
    });

    // --- 3. Tab Logic (Rules Page) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    // --- 4. Live API Fetching (Switched to mcsrvstat.us for better subdomain support) ---
    async function fetchStatus() {
        try {
            // Using mcsrvstat.us which is highly reliable for custom hosts
            const response = await fetch('https://api.mcsrvstat.us/3/dubai-premium.treemc.host:21152');
            const data = await response.json();

            const badge = document.getElementById('main-badge');
            const count = document.getElementById('player-count');
            const players = document.getElementById('player-list');
            
            if (data.online) {
                // Update Badge
                if (badge) {
                    badge.className = 'status-indicator';
                    badge.innerHTML = `<span class="dot online"></span><span class="status-text" style="color: var(--green)">ONLINE</span>`;
                }
                
                // Update Player Count (with animation)
                if (count) {
                    let startTimestamp = null;
                    const end = data.players.online || 0;
                    const duration = 1000;
                    
                    const step = (timestamp) => {
                        if (!startTimestamp) startTimestamp = timestamp;
                        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                        count.innerText = Math.floor(progress * end);
                        if (progress < 1) window.requestAnimationFrame(step);
                    };
                    window.requestAnimationFrame(step);
                }
                
                // Update Player List
                if (players) {
                    if (data.players.list && data.players.list.length > 0) {
                        players.innerHTML = '';
                        data.players.list.forEach(p => {
                            // mcsrvstat returns objects with a .name property
                            const name = typeof p === 'object' ? p.name : p;
                            
                            const tag = document.createElement('div');
                            tag.className = 'player-tag';
                            const headUrl = `https://mc-heads.net/avatar/${name}/24`;
                            tag.innerHTML = `<img src="${headUrl}" alt="${name}"> ${name}`;
                            players.appendChild(tag);
                        });
                    } else {
                        players.innerHTML = '<p class="empty-text">No players online.</p>';
                    }
                }
            } else {
                throw new Error("Server is offline");
            }
        } catch (error) {
            console.warn("API Error or Server Offline:", error);
            
            // Fallback / Offline State
            const badge = document.getElementById('main-badge');
            const count = document.getElementById('player-count');
            const players = document.getElementById('player-list');
            
            if (badge) {
                badge.className = 'status-indicator';
                badge.innerHTML = `<span class="dot offline"></span><span class="status-text" style="color: var(--red)">OFFLINE</span>`;
            }
            if (count) count.innerText = '0';
            if (players) players.innerHTML = '<p class="empty-text">Server is offline or unreachable.</p>';
        }
    }

    // Run on page load (Only if we are on the home page)
    if (document.getElementById('main-badge')) {
        fetchStatus();
        
        // Refresh every 60 seconds
        setInterval(fetchStatus, 60000);
    }
});
