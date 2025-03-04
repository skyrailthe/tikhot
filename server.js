const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/posts', async (req, res) => {
    try {
        // Fetch popular posts for the day
        const response = await axios.get(`${BASE_API_URL}/posts/popular?period=day`);
        
        console.log('API Response Structure:', Object.keys(response.data));
        
        // Check if the response has the expected structure
        if (!response.data) {
            console.error('Unexpected API response format:', response.data);
            return res.status(500).json({ error: 'Unexpected API response format' });
        }
        
        // The API might return data in different formats, let's handle both possibilities
        let postsData = [];
        
        if (Array.isArray(response.data)) {
            postsData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
            postsData = response.data.results;
        } else {
            console.error('Could not find posts array in API response');
            return res.status(500).json({ error: 'Could not find posts array in API response' });
        }
        
        // Transform posts to a consistent format
        const transformedPosts = postsData.map(post => {
            // Collect all media files (main file and attachments)
            const mediaFiles = [];
            
            // Add main file if it exists
            if (post.file && post.file.path) {
                mediaFiles.push({
                    name: post.file.name || 'main',
                    path: cleanMediaPath(post.file.path),
                    type: getMediaType(post.file.name)
                });
            }
            
            // Add attachments if they exist
            if (post.attachments && Array.isArray(post.attachments)) {
                post.attachments.forEach(attachment => {
                    if (attachment && attachment.path) {
                        mediaFiles.push({
                            name: attachment.name || 'attachment',
                            path: cleanMediaPath(attachment.path),
                            type: getMediaType(attachment.name)
                        });
                    }
                });
            }
            
            return {
                id: post.id,
                user: post.user || 'Anonymous',
                service: post.service || 'Unknown',
                content: post.title || post.substring || '',
                published: post.published || new Date().toISOString(),
                mediaFiles: mediaFiles
            };
        });
        
        console.log(`Returning ${transformedPosts.length} posts`);
        // Format the response to match what the client expects
        res.json({
            posts: transformedPosts,
            page: 1
        });
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
    }
});

// Helper function to clean media paths
function cleanMediaPath(path) {
    if (!path) return '';
    
    // Ensure the path is properly formatted
    if (path.startsWith('/')) {
        return `https://coomer.su${path}`;
    } else if (!path.startsWith('http')) {
        return `https://coomer.su/${path}`;
    }
    
    return path;
}

// Helper function to determine media type
function getMediaType(filename) {
    if (!filename) return 'unknown';
    
    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'webm', 'avi', 'mov'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    
    return 'unknown';
}

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const BASE_API_URL = 'https://coomer.su/api/v1';
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
