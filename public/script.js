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
        this.currentPost = null;
    }

    renderPost(post) {
        this.currentPost = post;
        const feedContainer = document.querySelector('.tiktok-feed');
        
        // Ensure post has mediaFiles and they are properly formatted
        if (!post.mediaFiles || !Array.isArray(post.mediaFiles) || post.mediaFiles.length === 0) {
            feedContainer.innerHTML = `
                <div class="no-content">
                    <h2>No media available</h2>
                    <p>This post doesn't contain any media files.</p>
                </div>
            `;
            return;
        }
        
        const cleanedMediaFiles = this.cleanMediaUrls(post.mediaFiles);
        
        if (cleanedMediaFiles.length === 0) {
            feedContainer.innerHTML = `
                <div class="no-content">
                    <h2>No media available</h2>
                    <p>This post doesn't contain any media files.</p>
                </div>
            `;
            return;
        }
        
        // Reset currentMediaIndex if it's out of bounds for the new post
        if (this.currentMediaIndex >= cleanedMediaFiles.length) {
            this.currentMediaIndex = 0;
        }
        
        const currentMedia = cleanedMediaFiles[this.currentMediaIndex];
        // Check if currentMedia exists and has a type property
        const isVideo = currentMedia && currentMedia.type === 'video';
        
        const postHTML = `
            <div class="video-post">
                <div class="video-header">
                    <div class="video-meta">
                        <span class="video-service">${post.service || 'Unknown'}</span>
                        <span class="video-author">${post.user || 'Anonymous'}</span>
                    </div>
                    <h2 class="video-title">${post.content || 'No description available'}</h2>
                </div>
                <div class="media-container">
                    ${isVideo ? `
                        <video class="main-media">
                            <source src="${currentMedia.path}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        
                        <div class="video-controls">
                            <div class="control-zone left-zone" data-action="rewind"></div>
                            <div class="control-zone center-zone" data-action="playpause"></div>
                            <div class="control-zone right-zone" data-action="forward"></div>
                        </div>
                        
                        <div class="controls-wrapper">
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-filled"></div>
                                </div>
                            </div>
                            
                            <div class="media-action-buttons">
                                <button class="mute-button material-button">
                                    <i class="fas fa-volume-mute"></i>
                                </button>
                                <button class="fullscreen-button material-button">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <img class="main-media" src="${currentMedia.path}" alt="${currentMedia.name || 'Media content'}">
                        <div class="media-action-buttons">
                            <button class="fullscreen-button material-button">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    `}
                </div>
                
                <div class="post-details">
                    <div class="post-header">
                        <span class="post-user">${post.user || 'Anonymous'}</span>
                        <span class="post-service">${post.service || 'Unknown'}</span>
                    </div>
                    <div class="post-text">${post.content || 'No description available'}</div>
                    <div class="post-date">${new Date(post.published).toLocaleString()}</div>
                </div>
                
                ${cleanedMediaFiles.length > 1 ? `
                <div class="media-carousel-controls">
                    <button class="prev-media material-button" ${this.currentMediaIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="media-counter">${this.currentMediaIndex + 1} / ${cleanedMediaFiles.length}</span>
                    <button class="next-media material-button" ${this.currentMediaIndex === cleanedMediaFiles.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        feedContainer.innerHTML = postHTML;
        
        // Немедленно добавим обработчики для таймлайна, чтобы гарантировать их работу
        const progressBar = document.querySelector('.progress-bar');
        const progressContainer = document.querySelector('.progress-container');
        const controlsWrapper = document.querySelector('.controls-wrapper');
        const video = document.querySelector('video');
        
        if (progressBar && video && isVideo) {
            // Добавляем обработчик клика напрямую
            const directClickHandler = (e) => {
                e.stopPropagation();
                console.log('Direct click on progress bar');
                
                if (!video.duration) return;
                
                const rect = progressBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const normalizedPos = Math.max(0, Math.min(1, pos));
                
                // Перематываем видео
                video.currentTime = normalizedPos * video.duration;
            };
            
            progressBar.addEventListener('click', directClickHandler, { capture: true });
            
            // Также добавляем обработчик для контейнера
            if (progressContainer) {
                progressContainer.addEventListener('click', (e) => {
                    // Не останавливаем распространение, если клик был на кнопке воспроизведения
                    if (!e.target.closest('.play-button-timeline')) {
                        e.stopPropagation();
                        console.log('Direct click on progress container');
                        
                        // Проверяем, не был ли клик на дочернем элементе
                        if (e.target === progressContainer || e.target === progressBar || e.target.closest('.progress-bar')) {
                            const rect = progressBar.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            const normalizedPos = Math.max(0, Math.min(1, pos));
                            
                            // Перематываем видео
                            video.currentTime = normalizedPos * video.duration;
                        }
                    }
                }, { capture: true });
            }
            
            // Убедимся, что controlsWrapper не перехватывает клики
            if (controlsWrapper) {
                controlsWrapper.addEventListener('click', (e) => {
                    // Не останавливаем распространение, позволяем событию дойти до дочерних элементов
                    console.log('Click on controls wrapper');
                }, { capture: false });
            }
        }
        
        // Setup media controls based on type
        if (isVideo) {
            this.setupVideoControls(cleanedMediaFiles);
        } else {
            this.setupImageControls(cleanedMediaFiles);
        }
        
        // Debug: Log to confirm timeline elements are created
        console.log('Progress container:', document.querySelector('.progress-container'));
        console.log('Progress bar:', document.querySelector('.progress-bar'));
        console.log('Progress filled:', document.querySelector('.progress-filled'));
    }

    setupVideoControls(mediaFiles) {
        const mediaContainer = document.querySelector('.media-container');
        if (!mediaContainer) return;
        
        const video = mediaContainer.querySelector('video');
        const muteButton = mediaContainer.querySelector('.mute-button');
        const fullscreenButton = mediaContainer.querySelector('.fullscreen-button');
        const progressBar = mediaContainer.querySelector('.progress-bar');
        const progressFilled = mediaContainer.querySelector('.progress-filled');
        const progressContainer = mediaContainer.querySelector('.progress-container');
        const leftZone = mediaContainer.querySelector('.left-zone');
        const centerZone = mediaContainer.querySelector('.center-zone');
        const rightZone = mediaContainer.querySelector('.right-zone');
        
        if (!video) return;
        
        // Initial state
        video.muted = true;
        
        // Set initial progress bar to 0
        if (progressFilled) {
            progressFilled.style.width = '0%';
        }
        
        // Play/Pause functionality
        const togglePlay = () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        };
        
        // Add event listener to center zone for play/pause
        if (centerZone) centerZone.addEventListener('click', togglePlay);
        
        // Left zone - rewind 10 seconds
        if (leftZone) {
            leftZone.addEventListener('click', () => {
                video.currentTime = Math.max(0, video.currentTime - 10);
            });
        }
        
        // Right zone - forward 10 seconds
        if (rightZone) {
            rightZone.addEventListener('click', () => {
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
            });
        }
        
        // Mute button
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                video.muted = !video.muted;
                muteButton.innerHTML = video.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : 
                    '<i class="fas fa-volume-up"></i>';
            });
        }
        
        // Fullscreen button
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', async () => {
                if (!document.fullscreenElement) {
                    try {
                        await mediaContainer.requestFullscreen();
                    } catch (err) {
                        try {
                            await mediaContainer.webkitRequestFullscreen();
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
        
        // Progress bar functionality - improved seeking
        const handleSeek = (e) => {
            e.stopPropagation(); // Prevent event bubbling
            
            if (!video.duration) return;
            
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const normalizedPos = Math.max(0, Math.min(1, pos));
            
            // Update video position
            video.currentTime = normalizedPos * video.duration;
            
            // Update progress bar visually
            if (progressFilled) {
                progressFilled.style.width = `${normalizedPos * 100}%`;
            }
            
            console.log('Seek event handled at position:', normalizedPos);
        };
        
        // Make the entire progress bar clickable
        if (progressBar) {
            // Remove any existing event listeners to avoid duplicates
            progressBar.removeEventListener('click', handleSeek);
            
            // Click event with capture phase to ensure it gets priority
            progressBar.addEventListener('click', handleSeek, { capture: true });
            progressBar.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                console.log('Progress bar mousedown detected');
            }, { capture: true });
            
            // Touch events with passive flag
            progressBar.addEventListener('touchstart', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                console.log('Progress bar touchstart detected');
                
                // Get the first touch
                if (e.touches && e.touches[0]) {
                    const touch = e.touches[0];
                    // Create a simulated click event
                    const simulatedEvent = {
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        stopPropagation: () => {} // Dummy function
                    };
                    handleSeek(simulatedEvent);
                }
            }, { passive: true, capture: true });
            
            // Make the progress container also clickable (for easier targeting)
            if (progressContainer) {
                // Remove any existing event listeners to avoid duplicates
                progressContainer.removeEventListener('click', () => {});
                
                progressContainer.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    console.log('Progress container click detected at:', e.clientX, e.clientY);
                    
                    // Check if the click is directly on the container or on one of its children
                    if (e.target === progressContainer || e.target === progressBar || e.target === progressFilled) {
                        const rect = progressBar.getBoundingClientRect();
                        
                        // Calculate position
                        const pos = (e.clientX - rect.left) / rect.width;
                        const normalizedPos = Math.max(0, Math.min(1, pos));
                        
                        video.currentTime = normalizedPos * video.duration;
                        if (progressFilled) {
                            progressFilled.style.width = `${normalizedPos * 100}%`;
                        }
                    }
                }, { capture: true });
                
                // Also handle touch events
                progressContainer.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    console.log('Progress container touchstart detected');
                    
                    // Get the first touch
                    if (e.touches && e.touches[0]) {
                        const touch = e.touches[0];
                        const rect = progressBar.getBoundingClientRect();
                        
                        // Calculate position
                        const pos = (touch.clientX - rect.left) / rect.width;
                        const normalizedPos = Math.max(0, Math.min(1, pos));
                        
                        video.currentTime = normalizedPos * video.duration;
                        if (progressFilled) {
                            progressFilled.style.width = `${normalizedPos * 100}%`;
                        }
                    }
                }, { passive: true, capture: true });
            }
        }
        
        // Update progress bar and time display
        video.addEventListener('timeupdate', () => {
            if (progressFilled && video.duration) {
                const progress = video.currentTime / video.duration;
                progressFilled.style.width = `${progress * 100}%`;
            }
        });
        
        this.setupCarouselControls(mediaFiles);
    }
    
    setupImageControls(mediaFiles) {
        const mediaContainer = document.querySelector('.media-container');
        if (!mediaContainer) return;
        
        const fullscreenButton = mediaContainer.querySelector('.fullscreen-button');
        const img = mediaContainer.querySelector('img.main-media');
        
        if (!img) return;
        
        // Fullscreen button for images
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', async () => {
                if (!document.fullscreenElement) {
                    try {
                        await mediaContainer.requestFullscreen();
                    } catch (err) {
                        try {
                            await mediaContainer.webkitRequestFullscreen();
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
        
        this.setupCarouselControls(mediaFiles);
    }
    
    setupCarouselControls(mediaFiles) {
        if (!mediaFiles || mediaFiles.length <= 1) return;
        
        const prevButton = document.querySelector('.prev-media');
        const nextButton = document.querySelector('.next-media');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.currentMediaIndex > 0) {
                    this.currentMediaIndex--;
                    // Re-render the same post with the updated media index
                    if (this.currentPost) {
                        this.renderPost(this.currentPost);
                    }
                }
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (this.currentMediaIndex < mediaFiles.length - 1) {
                    this.currentMediaIndex++;
                    // Re-render the same post with the updated media index
                    if (this.currentPost) {
                        this.renderPost(this.currentPost);
                    }
                }
            });
        }
    }

    cleanMediaUrls(mediaFiles) {
        if (!Array.isArray(mediaFiles)) {
            console.error('mediaFiles is not an array:', mediaFiles);
            return [];
        }
        
        return mediaFiles.filter(file => {
            // Filter out undefined or null files
            return file && typeof file === 'object';
        }).map(file => {
            // Ensure file has a type property
            if (!file.type) {
                file.type = this.guessFileType(file.path || '');
            }
            
            // Fix path if needed
            if (file.path && !file.path.startsWith('http') && !file.path.startsWith('/')) {
                file.path = '/' + file.path;
            }
            return file;
        }).filter(file => file.path);
    }
    
    // Helper method to guess file type based on file extension
    guessFileType(path) {
        if (!path) return 'unknown';
        
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        
        const lowercasePath = path.toLowerCase();
        
        for (const ext of videoExtensions) {
            if (lowercasePath.endsWith(ext)) {
                return 'video';
            }
        }
        
        for (const ext of imageExtensions) {
            if (lowercasePath.endsWith(ext)) {
                return 'image';
            }
        }
        
        // Default to image if we can't determine
        return 'image';
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
