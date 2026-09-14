/**
 * ProjectTemplateService — website + Python project templates (roadmapp.md §P12).
 */
import type { ProjectTemplate, TemplateCategory, TemplateFile, TemplateSummary } from '../types/template-types';
import type { ProjectWorkspaceService } from './project-workspace-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProjectTemplateService');

export interface IProjectTemplateService {
    listTemplates(category?: TemplateCategory): TemplateSummary[];
    getTemplate(templateId: string): ProjectTemplate | undefined;
    applyTemplate(templateId: string, projectId: string): Promise<number>;
    createTemplate(name: string, category: TemplateCategory, files: TemplateFile[], description?: string, tags?: string[]): ProjectTemplate;
}

let tplCounter = 0;

const BUILTIN_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'tpl-landing-page',
        name: 'Landing Page',
        description: 'Simple single-page website with hero, features, and contact sections',
        category: 'website',
        tags: ['landing', 'html', 'responsive'],
        files: [
            { path: '/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Landing Page</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <header>\n        <h1>Welcome</h1>\n        <p>A beautiful landing page</p>\n    </header>\n    <section id="features">\n        <h2>Features</h2>\n        <div class="feature"><h3>Fast</h3><p>Lightning quick performance</p></div>\n        <div class="feature"><h3>Secure</h3><p>Built-in security</p></div>\n        <div class="feature"><h3>Simple</h3><p>Easy to use</p></div>\n    </section>\n    <section id="contact">\n        <h2>Contact</h2>\n        <form><input type="email" placeholder="Email"><button>Subscribe</button></form>\n    </section>\n    <footer><p>&copy; 2026</p></footer>\n    <script src="script.js"></script>\n</body>\n</html>` },
            { path: '/style.css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }\nheader { background: #0f172a; color: white; padding: 4rem 2rem; text-align: center; }\nheader h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }\n#features { padding: 3rem 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto; }\n.feature { padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; }\n#contact { padding: 3rem 2rem; background: #f8fafc; text-align: center; }\nform { margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; }\ninput { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 4px; }\nbutton { padding: 0.5rem 1.5rem; background: #0f172a; color: white; border: none; border-radius: 4px; cursor: pointer; }\nfooter { padding: 2rem; text-align: center; background: #f1f5f9; }\n` },
            { path: '/script.js', content: `console.log('Landing page loaded');\ndocument.querySelector('form')?.addEventListener('submit', (e) => {\n    e.preventDefault();\n    alert('Thanks for subscribing!');\n});\n` },
        ],
        createdAt: Date.now(),
    },
    {
        id: 'tpl-portfolio',
        name: 'Portfolio',
        description: 'Developer portfolio with projects grid and about section',
        category: 'website',
        tags: ['portfolio', 'developer', 'grid'],
        files: [
            { path: '/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Portfolio</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <nav><a href="#about">About</a><a href="#projects">Projects</a></nav>\n    <header><h1>John Developer</h1><p>Full-stack engineer</p></header>\n    <section id="about"><h2>About Me</h2><p>I build things for the web.</p></section>\n    <section id="projects"><h2>Projects</h2><div class="grid"><div class="card"><h3>Project A</h3><p>Description</p></div><div class="card"><h3>Project B</h3><p>Description</p></div></div></section>\n    <script src="script.js"></script>\n</body>\n</html>` },
            { path: '/style.css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; }\nnav { display: flex; gap: 1rem; padding: 1rem 2rem; background: #0f172a; }\nnav a { color: white; text-decoration: none; }\nheader { padding: 4rem 2rem; text-align: center; background: #1e293b; color: white; }\nsection { padding: 3rem 2rem; max-width: 800px; margin: 0 auto; }\n.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem; }\n.card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; }\n` },
            { path: '/script.js', content: `console.log('Portfolio loaded');\n` },
        ],
        createdAt: Date.now(),
    },
    {
        id: 'tpl-python-cli',
        name: 'Python CLI',
        description: 'Command-line tool with argparse and tests',
        category: 'python',
        tags: ['cli', 'argparse', 'python'],
        files: [
            { path: '/main.py', content: `import argparse\nimport sys\n\ndef main():\n    parser = argparse.ArgumentParser(description='My CLI tool')\n    parser.add_argument('name', help='Name to greet')\n    parser.add_argument('--uppercase', action='store_true', help='Uppercase output')\n    args = parser.parse_args()\n    \n    greeting = f'Hello, {args.name}!'\n    if args.uppercase:\n        greeting = greeting.upper()\n    print(greeting)\n\nif __name__ == '__main__':\n    main()\n` },
            { path: '/requirements.txt', content: `# No external dependencies\n` },
            { path: '/test_main.py', content: `import subprocess\nimport sys\n\ndef test_greeting():\n    result = subprocess.run([sys.executable, 'main.py', 'World'], capture_output=True, text=True)\n    assert result.returncode == 0\n    assert 'Hello, World!' in result.stdout\n\ndef test_uppercase():\n    result = subprocess.run([sys.executable, 'main.py', 'World', '--uppercase'], capture_output=True, text=True)\n    assert 'HELLO, WORLD!' in result.stdout\n` },
        ],
        requirements: [],
        entryPoint: '/main.py',
        createdAt: Date.now(),
    },
    {
        id: 'tpl-python-api',
        name: 'Python REST API',
        description: 'Simple HTTP API with endpoints and error handling',
        category: 'python',
        tags: ['api', 'rest', 'http'],
        files: [
            { path: '/main.py', content: `from http.server import HTTPServer, BaseHTTPRequestHandler\nimport json\n\nclass APIHandler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        if self.path == '/health':\n            self.send_response(200)\n            self.send_header('Content-Type', 'application/json')\n            self.end_headers()\n            self.wfile.write(json.dumps({'status': 'ok'}).encode())\n        else:\n            self.send_response(404)\n            self.end_headers()\n\ndef main():\n    server = HTTPServer(('localhost', 8080), APIHandler)\n    print('API running on http://localhost:8080')\n    server.serve_forever()\n\nif __name__ == '__main__':\n    main()\n` },
            { path: '/requirements.txt', content: `# Uses only stdlib\n` },
        ],
        entryPoint: '/main.py',
        createdAt: Date.now(),
    },
    {
        id: 'tpl-blog',
        name: 'Blog',
        description: 'Simple blog with posts listing and single post view',
        category: 'website',
        tags: ['blog', 'posts', 'markdown'],
        files: [
            { path: '/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Blog</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <header><h1>My Blog</h1><nav><a href="/">Home</a></nav></header>\n    <main>\n        <article class="post"><h2><a href="/post1.html">First Post</a></h2><p class="date">Jan 1, 2026</p><p>Welcome to my blog!</p></article>\n        <article class="post"><h2><a href="/post2.html">Second Post</a></h2><p class="date">Jan 2, 2026</p><p>Another interesting article.</p></article>\n    </main>\n    <footer><p>&copy; 2026</p></footer>\n</body>\n</html>` },
            { path: '/post1.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>First Post</title><link rel="stylesheet" href="style.css"></head>\n<body><header><h1>My Blog</h1><nav><a href="/">Home</a></nav></header>\n<article><h1>First Post</h1><p class="date">Jan 1, 2026</p><p>This is my first blog post. Welcome to my new blog!</p></article></body></html>` },
            { path: '/post2.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>Second Post</title><link rel="stylesheet" href="style.css"></head>\n<body><header><h1>My Blog</h1><nav><a href="/">Home</a></nav></header>\n<article><h1>Second Post</h1><p class="date">Jan 2, 2026</p><p>Here is another interesting article about technology.</p></article></body></html>` },
            { path: '/style.css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: Georgia, serif; line-height: 1.7; color: #333; max-width: 700px; margin: 0 auto; padding: 2rem; }\nheader { margin-bottom: 2rem; }\nnav a { color: #3b82f6; text-decoration: none; }\n.post { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #eee; }\n.date { color: #999; font-size: 0.85rem; }\nfooter { margin-top: 2rem; color: #999; font-size: 0.85rem; }\n` },
        ],
        createdAt: Date.now(),
    },
    {
        id: 'tpl-dashboard',
        name: 'Dashboard',
        description: 'Admin dashboard with sidebar, stats cards, and data table',
        category: 'website',
        tags: ['dashboard', 'admin', 'data'],
        files: [
            { path: '/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Dashboard</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <aside class="sidebar">\n        <h2>Dashboard</h2>\n        <nav><a href="#">Overview</a><a href="#">Users</a><a href="#">Settings</a></nav>\n    </aside>\n    <main>\n        <div class="stats">\n            <div class="card"><h3>Users</h3><p class="value">1,234</p></div>\n            <div class="card"><h3>Revenue</h3><p class="value">$12,345</p></div>\n            <div class="card"><h3>Orders</h3><p class="value">567</p></div>\n        </div>\n        <table>\n            <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>\n            <tbody>\n                <tr><td>Alice</td><td>alice@example.com</td><td>Active</td></tr>\n                <tr><td>Bob</td><td>bob@example.com</td><td>Pending</td></tr>\n            </tbody>\n        </table>\n    </main>\n</body>\n</html>` },
            { path: '/style.css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; display: flex; min-height: 100vh; }\n.sidebar { width: 200px; background: #0f172a; color: white; padding: 1.5rem; }\n.sidebar nav { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }\n.sidebar a { color: #94a3b8; text-decoration: none; padding: 0.4rem 0.5rem; border-radius: 4px; }\n.sidebar a:hover { background: rgba(255,255,255,0.1); color: white; }\nmain { flex: 1; padding: 2rem; background: #f8fafc; }\n.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }\n.card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n.card h3 { color: #64748b; font-size: 0.85rem; }\n.card .value { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }\ntable { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\nth, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }\nth { background: #f1f5f9; font-weight: 600; }\n` },
        ],
        createdAt: Date.now(),
    },
    {
        id: 'tpl-flask-api',
        name: 'Flask API',
        description: 'Python Flask REST API with endpoints and error handling',
        category: 'python',
        tags: ['flask', 'api', 'rest'],
        files: [
            { path: '/app.py', content: `from flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\nitems = []\n\n@app.route('/api/items', methods=['GET'])\ndef get_items():\n    return jsonify(items)\n\n@app.route('/api/items', methods=['POST'])\ndef create_item():\n    data = request.get_json()\n    items.append(data)\n    return jsonify(data), 201\n\n@app.route('/api/items/<int:index>', methods=['DELETE'])\ndef delete_item(index):\n    if 0 <= index < len(items):\n        removed = items.pop(index)\n        return jsonify(removed)\n    return jsonify({'error': 'Not found'}), 404\n\n@app.route('/health')\ndef health():\n    return jsonify({'status': 'ok'})\n\nif __name__ == '__main__':\n    app.run(debug=True)\n` },
            { path: '/requirements.txt', content: `flask>=3.0\n` },
            { path: '/test_app.py', content: `import json\nfrom app import app\n\ndef test_health():\n    with app.test_client() as client:\n        resp = client.get('/health')\n        assert resp.status_code == 200\n        assert resp.get_json()['status'] == 'ok'\n\ndef test_crud():\n    with app.test_client() as client:\n        resp = client.post('/api/items', json={'name': 'test'})\n        assert resp.status_code == 201\n        resp = client.get('/api/items')\n        assert len(resp.get_json()) == 1\n` },
        ],
        requirements: ['flask'],
        entryPoint: '/app.py',
        createdAt: Date.now(),
    },
    {
        id: 'tpl-data-viz',
        name: 'Data Visualization',
        description: 'Interactive data visualization with Chart.js',
        category: 'website',
        tags: ['chart', 'data', 'visualization'],
        files: [
            { path: '/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Data Visualization</title>\n    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Data Dashboard</h1>\n    <div class="charts">\n        <div class="chart-container"><canvas id="barChart"></canvas></div>\n        <div class="chart-container"><canvas id="lineChart"></canvas></div>\n    </div>\n    <script src="script.js"></script>\n</body>\n</html>` },
            { path: '/style.css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; padding: 2rem; background: #f8fafc; }\nh1 { margin-bottom: 1.5rem; color: #1e293b; }\n.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }\n.chart-container { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n` },
            { path: '/script.js', content: `// Bar Chart\nnew Chart(document.getElementById('barChart'), {\n    type: 'bar',\n    data: {\n        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],\n        datasets: [{ label: 'Sales', data: [65, 59, 80, 81, 56], backgroundColor: '#3b82f6' }]\n    },\n    options: { responsive: true }\n});\n\n// Line Chart\nnew Chart(document.getElementById('lineChart'), {\n    type: 'line',\n    data: {\n        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],\n        datasets: [{ label: 'Users', data: [10, 25, 35, 45, 60], borderColor: '#22c55e', fill: false }]\n    },\n    options: { responsive: true }\n});\n` },
        ],
        createdAt: Date.now(),
    },
];

export class ProjectTemplateService implements IProjectTemplateService {
    private templates: ProjectTemplate[];
    private workspace: ProjectWorkspaceService;

    constructor(workspace: ProjectWorkspaceService) {
        this.workspace = workspace;
        this.templates = [...BUILTIN_TEMPLATES];
    }

    listTemplates(category?: TemplateCategory): TemplateSummary[] {
        const list = category ? this.templates.filter((t) => t.category === category) : this.templates;
        return list.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            tags: t.tags,
            fileCount: t.files.length,
        }));
    }

    getTemplate(templateId: string): ProjectTemplate | undefined {
        return this.templates.find((t) => t.id === templateId);
    }

    async applyTemplate(templateId: string, projectId: string): Promise<number> {
        const template = this.templates.find((t) => t.id === templateId);
        if (!template) throw new Error(`Template not found: ${templateId}`);

        let appliedCount = 0;
        for (const file of template.files) {
            await this.workspace.writeFile(projectId, file.path, file.content);
            appliedCount++;
        }

        LOGGER.info('applyTemplate', `Applied template '${template.name}' to project ${projectId}: ${appliedCount} files`);
        return appliedCount;
    }

    createTemplate(name: string, category: TemplateCategory, files: TemplateFile[], description = '', tags: string[] = []): ProjectTemplate {
        const template: ProjectTemplate = {
            id: `tpl-${Date.now()}-${++tplCounter}`,
            name,
            description,
            category,
            tags,
            files,
            createdAt: Date.now(),
        };
        this.templates.push(template);
        LOGGER.info('createTemplate', `Created template '${name}' (${category})`);
        return template;
    }
}
