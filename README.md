<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kasimir Browser README</title>
    <style>
        :root {
            --bg-color: #f8f9fa;
            --text-color: #333;
            --accent-color: #e60023;
            --secondary-color: #4285f4;
            --card-bg: #fff;
            --code-bg: #f1f3f5;
            --border-color: #dee2e6;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #121212;
                --text-color: #e0e0e0;
                --card-bg: #1e1e1e;
                --code-bg: #2a2a2a;
                --border-color: #333;
                --shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            }
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
        }

        h1, h2, h3 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        h1 {
            font-size: 2.5rem;
            text-align: center;
            color: var(--accent-color);
        }

        h2 {
            font-size: 1.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--accent-color);
        }

        h3 {
            font-size: 1.3rem;
            color: var(--secondary-color);
        }

        p {
            margin-bottom: 1rem;
        }

        .container {
            background-color: var(--card-bg);
            padding: 2rem;
            border-radius: 8px;
            box-shadow: var(--shadow);
        }

        .warning-banner {
            background-color: #fff3cd;
            color: #856404;
            border-left: 5px solid #ffeeba;
            padding: 1rem;
            margin: 2rem 0;
            border-radius: 4px;
        }

        @media (prefers-color-scheme: dark) {
            .warning-banner {
                background-color: #332701;
                color: #ffd04c;
                border-left: 5px solid #665800;
            }
        }

        code, pre {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            background-color: var(--code-bg);
            border-radius: 4px;
        }

        code {
            padding: 0.2em 0.4em;
            font-size: 0.9em;
        }

        pre {
            padding: 1rem;
            overflow-x: auto;
            margin: 1rem 0;
        }

        pre code {
            padding: 0;
            background-color: transparent;
        }

        ul, ol {
            margin-bottom: 1rem;
            padding-left: 2rem;
        }

        li {
            margin-bottom: 0.5rem;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }

        .feature-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1rem;
            box-shadow: var(--shadow);
        }

        .feature-card h3 {
            margin-top: 0;
            font-size: 1.1rem;
            color: var(--accent-color);
        }

        .kbd {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 3px;
            box-shadow: 0 1px 1px rgba(0,0,0,.2);
            padding: 0.1em 0.5em;
            margin: 0 0.2em;
            font-family: inherit;
            font-size: 0.9em;
            min-width: 1em;
            text-align: center;
        }

        footer {
            margin-top: 3rem;
            text-align: center;
            font-size: 0.9rem;
            color: #666;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Kasimir Browser</h1>
        
        <p style="text-align: center; font-style: italic; font-size: 1.2rem;">
            A sleek, customizable Electron-based web browser with a modern interface.
        </p>

        <div class="warning-banner">
            <strong>⚠️ BETA / WORK IN PROGRESS ⚠️</strong><br>
            This project is in early development. Features may be incomplete, unstable, or might change significantly. Don't take it too seriously yet - we're still working on it!
        </div>

        <h2 id="features">🌟 Features</h2>
        <div class="features-grid">
            <div class="feature-card">
                <h3>Modern UI</h3>
                <p>Customizable themes including midnight, light, ocean, forest, sunset, and more.</p>
            </div>
            <div class="feature-card">
                <h3>Vertical Sidebar Tabs</h3>
                <p>Better screen space utilization with a collapsible tab sidebar.</p>
            </div>
            <div class="feature-card">
                <h3>Startup Animation</h3>
                <p>Sleek, modern startup animation when launching the browser.</p>
            </div>
            <div class="feature-card">
                <h3>Bookmarks Management</h3>
                <p>Easy-to-use bookmark system on the homepage.</p>
            </div>
            <div class="feature-card">
                <h3>Nostalgic Themes</h3>
                <p>Including Windows XP and Windows 9x themes for retro lovers.</p>
            </div>
            <div class="feature-card">
                <h3>Tab Management</h3>
                <p>Intuitive drag and drop support for organizing tabs.</p>
            </div>
        </div>

        <h2 id="installation">🚀 Installation</h2>
        <pre><code># Clone the repository
git clone https://github.com/your-username/kasimir-browser.git

# Navigate to the project directory
cd kasimir-browser

# Install dependencies
npm install

# Start the application
npm start

# Build for your platform
npm run dist</code></pre>

        <h2 id="development">🛠️ Development</h2>
        <p>Kasimir Browser is built using:</p>
        <ul>
            <li>Electron</li>
            <li>HTML/CSS/JavaScript</li>
            <li>No frameworks - just vanilla code!</li>
        </ul>

        <h2 id="shortcuts">🔑 Keyboard Shortcuts</h2>
        <ul>
            <li><span class="kbd">Ctrl</span> + <span class="kbd">T</span> - New tab</li>
            <li><span class="kbd">Ctrl</span> + <span class="kbd">W</span> - Close tab</li>
            <li><span class="kbd">Ctrl</span> + <span class="kbd">Tab</span> / <span class="kbd">Ctrl</span> + <span class="kbd">Shift</span> + <span class="kbd">Tab</span> - Next/previous tab</li>
            <li><span class="kbd">Ctrl</span> + <span class="kbd">L</span> - Focus address bar</li>
            <li><span class="kbd">Ctrl</span> + <span class="kbd">R</span> or <span class="kbd">F5</span> - Reload page</li>
            <li><span class="kbd">Alt</span> + <span class="kbd">←</span>/<span class="kbd">→</span> - Back/forward</li>
            <li><span class="kbd">Ctrl</span> + <span class="kbd">,</span> - Open settings</li>
        </ul>

        <h2 id="project-structure">⚙️ Project Structure</h2>
        <pre><code>kasimir-browser/
│
├── main.js            # Main Electron process
├── renderer.js        # Browser UI renderer
├── preload.js         # Preload script for security
├── index.html         # Main browser UI
├── homepage.html      # New tab page
├── style.css          # Main styles
└── animation.css      # UI animations</code></pre>

        <h2 id="status">🚧 Status</h2>
        <p>This project is currently in <strong>BETA</strong> and under active development. Many features are experimental and subject to change. Consider this a fun project to explore rather than a daily driver browser!</p>
        
        <p>Known limitations:</p>
        <ul>
            <li>Some features may not work as expected</li>
            <li>Performance optimizations are still in progress</li>
            <li>Security features are not fully implemented</li>
        </ul>

        <h2 id="license">📄 License</h2>
        <p>This project is licensed under the MIT License - see the LICENSE file for details.</p>

        <h2 id="contributing">🤝 Contributing</h2>
        <p>Since this is a work in progress, contributions are welcome but please understand that the project architecture may change significantly as it develops.</p>

        <footer>
            <p><em>Kasimir Browser is a personal project and not intended for production use. Have fun with it, but maybe don't use it for your banking just yet! 😉</em></p>
        </footer>
    </div>
</body>
</html>
