class VideoFeed {
    constructor() {
        this.currentPostIndex = 0;
        this.posts = [];
        this.postRenderer = new PostRenderer();
        this.loadPosts();
        
        // Set up navigation controls
        document.getElementById('prev-post').addEventListener('click', () => this.navigateToPreviousPost());
        document.getElementById('next-post').addEventListener('click', () => this.navigateToNextPost());
    }

    async loadPosts() {
        try {
            // Show loading state
            document.querySelector('.tiktok-feed').innerHTML = `
                <div class="loading">
                    <h2>Loading content...</h2>
                    <p>Please wait while we fetch the latest posts.</p>
                </div>
            `;
            
            const response = await fetch('/api/posts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched posts:', data);
            
            if (!data || !data.posts || !Array.isArray(data.posts) || data.posts.length === 0) {
                console.error('No posts found in response:', data);
                this.handleEmptyPosts();
                return;
            }
            
            console.log(`Found ${data.posts.length} posts`);
            console.log('First post sample:', data.posts[0]);
            
            this.posts = data.posts;
            this.renderCurrentPost();
            this.updateNavigationButtons();
        } catch (error) {
            console.error('Error loading posts:', error);
            document.querySelector('.tiktok-feed').innerHTML = `
                <div class="error">
                    <h2>Error loading content</h2>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    renderCurrentPost() {
        if (this.posts.length === 0) {
            this.handleEmptyPosts();
            return;
        }
        
        const post = this.posts[this.currentPostIndex];
        console.log('Rendering post:', post);
        this.postRenderer.renderPost(post);
    }

    handleEmptyPosts() {
        document.querySelector('.tiktok-feed').innerHTML = `
            <div class="no-content">
                <h2>No posts available</h2>
                <p>Try again later or check your connection.</p>
            </div>
        `;
        
        // Disable navigation buttons
        document.getElementById('prev-post').disabled = true;
        document.getElementById('next-post').disabled = true;
    }

    navigateToPreviousPost() {
        if (this.currentPostIndex > 0) {
            this.currentPostIndex--;
            this.renderCurrentPost();
            this.updateNavigationButtons();
        }
    }

    navigateToNextPost() {
        if (this.currentPostIndex < this.posts.length - 1) {
            this.currentPostIndex++;
            this.renderCurrentPost();
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        const prevButton = document.getElementById('prev-post');
        const nextButton = document.getElementById('next-post');
        
        prevButton.disabled = this.currentPostIndex === 0;
        nextButton.disabled = this.currentPostIndex === this.posts.length - 1;
    }
}

class PostRenderer {
    constructor() {
        this.currentMediaIndex = 0;
    }

    renderPost(post) {
        const feedContainer = document.querySelector('.tiktok-feed');
        const cleanedMediaFiles = this.cleanMediaUrls(post.mediaFiles || []);
        
        const postHTML = `
            <div class="video-post">
                <div class="video-header">
                    <div class="video-meta">
                        <span class="video-service">${post.service || 'Unknown'}</span>
                        <span class="video-author">${post.user || 'Anonymous'}</span>
                    </div>
                    <h2 class="video-title">${post.content || 'No description available'}</h2>
                </div>
                <div class="video-container">
                    <video>
                        <source src="${cleanedMediaFiles[0].path}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-controls">
                        <div class="control-zone left-zone" data-action="rewind"></div>
                        <div class="control-zone center-zone" data-action="playpause"></div>
                        <div class="control-zone right-zone" data-action="forward"></div>
                    </div>
                    <button class="play-button">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-filled"></div>
                        </div>
                        <div class="time-display">
                            <span class="current-time">0:00</span>
                            <span class="duration">0:00</span>
                        </div>
                    </div>
                    <button class="mute-button">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="fullscreen-button">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
                <div class="carousel-controls">
                    <button class="carousel-button prev-media" ${cleanedMediaFiles.length <= 1 ? 'style="display:none"' : ''}>
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <button class="carousel-button next-media" ${cleanedMediaFiles.length <= 1 ? 'style="display:none"' : ''}>
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        feedContainer.innerHTML = postHTML;
        this.setupCustomVideoControls(cleanedMediaFiles);
    }

    setupCustomVideoControls(mediaFiles) {
        const videoContainer = document.querySelector('.video-container');
        if (!videoContainer) return;
        
        const video = videoContainer.querySelector('video');
        const leftZone = videoContainer.querySelector('.left-zone');
        const centerZone = videoContainer.querySelector('.center-zone');
        const rightZone = videoContainer.querySelector('.right-zone');
        const playButton = videoContainer.querySelector('.play-button');
        const progressBar = videoContainer.querySelector('.progress-bar');
        const progressFilled = videoContainer.querySelector('.progress-filled');
        const currentTimeDisplay = videoContainer.querySelector('.current-time');
        const durationDisplay = videoContainer.querySelector('.duration');
        const muteButton = videoContainer.querySelector('.mute-button');
        const fullscreenButton = videoContainer.querySelector('.fullscreen-button');
        const prevButton = document.querySelector('.prev-media');
        const nextButton = document.querySelector('.next-media');
        
        if (!video || !leftZone || !centerZone || !rightZone) return;
        
        // Initial state
        video.muted = true;
        
        // Center zone and play button - play/pause
        const togglePlay = () => {
            if (video.paused) {
                video.play();
                playButton.style.opacity = '0';
                playButton.style.pointerEvents = 'none';
            } else {
                video.pause();
                playButton.style.opacity = '1';
                playButton.style.pointerEvents = 'auto';
            }
        };
        
        centerZone.addEventListener('click', togglePlay);
        if (playButton) {
            playButton.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlay();
            });
        }
        
        // Show play button when video ends
        video.addEventListener('ended', () => {
            playButton.style.opacity = '1';
            playButton.style.pointerEvents = 'auto';
        });
        
        // Left zone - rewind 15 seconds
        leftZone.addEventListener('click', () => {
            video.currentTime = Math.max(0, video.currentTime - 15);
        });
        
        // Right zone - forward 15 seconds
        rightZone.addEventListener('click', () => {
            video.currentTime = Math.min(video.duration, video.currentTime + 15);
        });
        
        // Mute button
        if (muteButton) {
            muteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = !video.muted;
                muteButton.innerHTML = video.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : 
                    '<i class="fas fa-volume-up"></i>';
            });
        }
        
        // Double tap to toggle mute
        let lastTap = 0;
        videoContainer.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                video.muted = !video.muted;
                muteButton.innerHTML = video.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : 
                    '<i class="fas fa-volume-up"></i>';
                e.preventDefault();
            }
            lastTap = currentTime;
        });
        
        // Fullscreen button
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                if (!document.fullscreenElement) {
                    try {
                        await videoContainer.requestFullscreen();
                    } catch (err) {
                        try {
                            await videoContainer.webkitRequestFullscreen();
                        } catch (err2) {
                            console.error('Could not enter fullscreen:', err2);
                        }
                    }
                } else {
                    try {
                        await document.exitFullscreen();
                    } catch (err) {
                        try {
                            await document.webkitExitFullscreen();
                        } catch (err2) {
                            console.error('Could not exit fullscreen:', err2);
                        }
                    }
                }
            });
        }
        
        // Progress bar functionality
        if (progressBar) {
            const handleSeek = (e) => {
                const rect = progressBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const normalizedPos = Math.max(0, Math.min(1, pos));
                
                if (video.duration) {
                    video.currentTime = normalizedPos * video.duration;
                    progressFilled.style.width = `${normalizedPos * 100}%`;
                }
            };
            
            progressBar.addEventListener('click', handleSeek);
            progressBar.addEventListener('touchstart', handleSeek);
        }
        
        // Update progress bar and time display
        video.addEventListener('timeupdate', () => {
            if (progressBar && video.duration) {
                const progress = video.currentTime / video.duration;
                progressFilled.style.width = `${progress * 100}%`;
                currentTimeDisplay.textContent = this.formatTime(video.currentTime);
            }
        });
        
        // Set duration when metadata is loaded
        video.addEventListener('loadedmetadata', () => {
            if (durationDisplay && video.duration) {
                durationDisplay.textContent = this.formatTime(video.duration);
            }
        });

        // Carousel navigation
        if (mediaFiles.length > 1) {
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.currentMediaIndex = (this.currentMediaIndex - 1 + mediaFiles.length) % mediaFiles.length;
                    video.src = mediaFiles[this.currentMediaIndex].path;
                    video.load();
                    playButton.style.opacity = '1';
                    playButton.style.pointerEvents = 'auto';
                });
            }
            
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.currentMediaIndex = (this.currentMediaIndex + 1) % mediaFiles.length;
                    video.src = mediaFiles[this.currentMediaIndex].path;
                    video.load();
                    playButton.style.opacity = '1';
                    playButton.style.pointerEvents = 'auto';
                });
            }
        }
    }

    cleanMediaUrls(mediaFiles) {
        if (!Array.isArray(mediaFiles)) {
            console.error('mediaFiles is not an array:', mediaFiles);
            return [];
        }
        
        return mediaFiles.map(file => {
            if (!file || typeof file !== 'object') {
                console.error('Invalid media file object:', file);
                return { path: '', name: 'invalid', type: 'unknown' };
            }
            
            if (file.path && !file.path.startsWith('http') && !file.path.startsWith('/')) {
                file.path = '/' + file.path;
            }
            return file;
        }).filter(file => file.path);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoFeed();
});
