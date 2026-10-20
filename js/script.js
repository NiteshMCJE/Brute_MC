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

    // --- 4. Live API Fetching (Using mcstatus.io) ---
    const serverIP = 'brutemc.dpdns.org';
    const serverPort = '25565'; // Default Minecraft port
    const apiURL = `https://api.mcstatus.io/v2/status/java/${serverIP}:${serverPort}`;

    if (document.getElementById('server-status')) {
        
        // We use a session start time to mock uptime since APIs rarely provide exact boot times
        let sessionStartTime = Date.now() - (2 * 60 * 60 * 1000); 
        
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
                    // --- ONLINE STATE ---
                    statusDot.className = 'dot online';
                    statusText.innerText = 'ONLINE';
                    statusText.style.color = 'var(--green)';
                    
                    // Player Counts (mcstatus.io returns online/max directly)
                    const currentPlayers = data.players.online;
                    const maxPlayers = data.players.max || 50;
                    
                    animateValue(playerCountEl, 0, currentPlayers, 1000);
                    playerMaxEl.innerText = maxPlayers;
                    
                    // Version (mcstatus.io returns an object with name_clean)
                    versionEl.innerText = data.version.name_clean || data.version.name_raw || '1.21.x';
                    
                    // Uptime Logic
                    updateUptime(uptimeEl, sessionStartTime);

                    // Player List
                    if (currentPlayers > 0 && data.players.list && data.players.list.length > 0) {
                        playerListEl.innerHTML = '';
                        
                        data.players.list.forEach(player => {
                            const tag = document.createElement('div');
                            tag.className = 'player-tag';
                            
                            // mcstatus.io uses 'name_clean' for the plain text name
                            const playerName = player.name_clean || 'Unknown';
                            
                            // Use mc-heads.net for avatars
                            const headUrl = `https://mc-heads.net/avatar/${playerName}/24`;
                            
                            tag.innerHTML = `<img src="${headUrl}" alt="${playerName}"> ${playerName}`;
                            playerListEl.appendChild(tag);
                        });
                    } else if (currentPlayers === 0) {
                        playerListEl.innerHTML = '<p class="empty-text">No players currently online.</p>';
                    } else {
                        playerListEl.innerHTML = '<p class="empty-text">Server hides player list (Query disabled).</p>';
                    }

                } else {
                    // --- OFFLINE STATE ---
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

        function updateUptime(element, startTime) {
            const now = Date.now();
            const diff = now - startTime;
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            element.innerText = `${hours}h ${minutes}m`;
        }

        function animateValue(obj, start, end, duration) {
            if (!obj) return;
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
        
        // Live Uptime update loop
        setInterval(() => {
            const uptimeEl = document.getElementById('server-uptime');
            if (uptimeEl && document.querySelector('#server-status .dot').classList.contains('online')) {
                updateUptime(uptimeEl, sessionStartTime);
            }
        }, 60000);

        // Re-fetch full API data every 60 seconds
        setInterval(fetchServerStatus, 60000);
    }
});
