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
    
    // Create toast element
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
                
                // Visual feedback on button
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
                // Remove active class from all
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active to clicked
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    // --- 4. Live API Fetching (Home Page) ---
    const serverIP = 'brutemc.dpdns.org';
    const apiURL = `https://api.mcsrvstat.us/3/${serverIP}`;

    // Only run API fetch if elements exist on page
    if (document.getElementById('server-status')) {
        
        // Mock start time for uptime calculation
        let sessionStartTime = Date.now() - (2 * 60 * 60 * 1000); // Mock: server started 2 hours ago
        
        async function fetchServerStatus() {
            try {
                const response = await fetch(apiURL);
                const data = await response.json();
                
                const statusDot = document.querySelector('#server-status .dot');
                const statusText = document.querySelector('#server-status .status-text');
                const playerCountEl = document.getElementById('player-count');
                const playerMaxEl = document.getElementById('player-max');
                const versionEl = document.getElementById('server-version');
                const uptimeEl = document.getElementById('server-uptime');
                const playerListEl = document.getElementById('player-list');

                if (data.online) {
                    // Online State
                    statusDot.className = 'dot online';
                    statusText.innerText = 'ONLINE';
                    statusText.style.color = 'var(--green)';
                    
                    // Player Counts with Count-Up Animation
                    const currentPlayers = data.players.online;
                    const maxPlayers = data.players.max || 50;
                    animateValue(playerCountEl, 0, currentPlayers, 1000);
                    playerMaxEl.innerText = maxPlayers;
                    
                    // Version
                    versionEl.innerText = data.version || '1.21.x';
                    
                    // Uptime Logic
                    updateUptime(uptimeEl, sessionStartTime);

                    // Player List
                    if (currentPlayers > 0 && data.players.list) {
                        playerListEl.innerHTML = '';
                        
                        data.players.list.forEach(player => {
                            // FIX: Extract name and UUID correctly from the API object
                            const playerName = player.name || player;
                            const playerUUID = player.uuid || playerName; // Fallback to name if UUID missing

                            const tag = document.createElement('div');
                            tag.className = 'player-tag';
                            
                            // Use mc-heads.net for avatars (using UUID for accuracy)
                            const headUrl = `https://mc-heads.net/avatar/${playerUUID}/24`;
                            
                            tag.innerHTML = `<img src="${headUrl}" alt="${playerName}"> ${playerName}`;
                            playerListEl.appendChild(tag);
                        });
                    } else if (currentPlayers === 0) {
                        playerListEl.innerHTML = '<p class="empty-text">No players currently online.</p>';
                    } else {
                        // Online but list is hidden/not returned
                        playerListEl.innerHTML = '<p class="empty-text">Player list hidden by server.</p>';
                    }

                } else {
                    // Offline State
                    setOfflineState();
                }
            } catch (error) {
                console.error("API Error:", error);
                setOfflineState();
            }
        }

        function setOfflineState() {
            document.querySelector('#server-status .dot').className = 'dot offline';
            const statusText = document.querySelector('#server-status .status-text');
            statusText.innerText = 'OFFLINE';
            statusText.style.color = 'var(--red)';
            
            document.getElementById('player-count').innerText = '0';
            document.getElementById('player-max').innerText = '0';
            document.getElementById('server-version').innerText = '--';
            document.getElementById('server-uptime').innerText = '0h 0m';
            document.getElementById('player-list').innerHTML = '<p class="empty-text">Server is offline.</p>';
        }

        // Helper: Live Uptime Calculator
        function updateUptime(element, startTime) {
            const now = Date.now();
            const diff = now - startTime;
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            element.innerText = `${hours}h ${minutes}m`;
        }

        // Helper: Number Count-Up Animation
        function animateValue(obj, start, end, duration) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerHTML = Math.floor(progress * (end - start) + start);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        // Initial fetch
        fetchServerStatus();
        
        // Update uptime every minute
        setInterval(() => {
            const uptimeEl = document.getElementById('server-uptime');
            if (uptimeEl && document.querySelector('#server-status .dot').classList.contains('online')) {
                updateUptime(uptimeEl, sessionStartTime);
            }
        }, 60000);

        // Fetch new player data every 60 seconds
        setInterval(fetchServerStatus, 60000);
    }
});
