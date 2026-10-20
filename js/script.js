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

    // --- 4. Live API Fetching (Home Page) ---
    const serverIP = 'brutemc.dpdns.org';
    const apiURL = `https://api.mcsrvstat.us/3/${serverIP}`;

    if (document.getElementById('server-status')) {
        
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
                    statusDot.className = 'dot online';
                    statusText.innerText = 'ONLINE';
                    statusText.style.color = 'var(--green)';
                    
                    const currentPlayers = data.players.online;
                    const maxPlayers = data.players.max || 50;
                    
                    animateValue(playerCountEl, 0, currentPlayers, 1000);
                    playerMaxEl.innerText = maxPlayers;
                    versionEl.innerText = data.version || '1.21.x';
                    
                    updateUptime(uptimeEl, sessionStartTime);

                    // --- THE PLAYER LIST FIX ---
                    if (currentPlayers > 0 && data.players.list) {
                        playerListEl.innerHTML = '';
                        
                        let playerNames = [];

                        // Check if the API returned an array (Objects or Strings)
                        if (Array.isArray(data.players.list)) {
                            data.players.list.forEach(p => {
                                // If it's an object, grab the name. If it's a string, grab the string.
                                let name = typeof p === 'object' ? p.name : p;
                                if (name) playerNames.push(name);
                            });
                        } 
                        // Check if the API returned a raw string (e.g. "Notch, Herobrine")
                        else if (typeof data.players.list === 'string') {
                            playerNames = data.players.list.split(',').map(n => n.trim());
                        }

                        // Render the extracted names
                        if (playerNames.length > 0) {
                            playerNames.forEach(name => {
                                const tag = document.createElement('div');
                                tag.className = 'player-tag';
                                // Use mc-heads.net for avatars
                                const headUrl = `https://mc-heads.net/avatar/${name}/24`;
                                tag.innerHTML = `<img src="${headUrl}" alt="${name}"> ${name}`;
                                playerListEl.appendChild(tag);
                            });
                        } else {
                            playerListEl.innerHTML = '<p class="empty-text">Players are online, but names are hidden.</p>';
                        }

                    } else if (currentPlayers === 0) {
                        playerListEl.innerHTML = '<p class="empty-text">No players currently online.</p>';
                    } else {
                        playerListEl.innerHTML = '<p class="empty-text">Server hides player list (Query disabled).</p>';
                    }

                } else {
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

        fetchServerStatus();
        setInterval(() => {
            const uptimeEl = document.getElementById('server-uptime');
            if (uptimeEl && document.querySelector('#server-status .dot').classList.contains('online')) {
                updateUptime(uptimeEl, sessionStartTime);
            }
        }, 60000);
        setInterval(fetchServerStatus, 60000);
    }
});
