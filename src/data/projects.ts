export interface Project {
	slug: string
	title: string
	subtitle: string
	description: string // Short, for card
	tags: string[]
	images: string[]
	link?: string
	github?: string
	year?: number
	sections: ProjectSection[]
}

export interface ProjectSection {
	heading: string
	body: string
}

export const projects: Project[] = [
	{
		slug: 'economic-data',
		title: 'Economic Data',
		subtitle: 'Economy tools & dashboards',
		description:
			'A personal collection of economy-related tools and interactive dashboards — from a full life financial simulator to housing market analysis and tax calculators.',
		tags: ['Next.js', 'Data', 'Economics', 'Dashboard'],
		images: [
			'/images/projects/economic-data/screenshot-1.png',
			'/images/projects/economic-data/screenshot-2.png',
		],
		link: 'https://economic-data.vercel.app/',
		year: 2024,
		sections: [
			{
				heading: 'What is it?',
				body: 'Economic Data is a web platform where I publish interactive tools that I find useful for personal finance and economics research. The goal is to make complex financial and economic data easy to explore and understand through well-designed, interactive visualizations.',
			},
			{
				heading: 'Tools included',
				body: 'The platform currently features a **Life Simulator Dashboard** — a full financial model where users set inputs like gross salary, savings rate, number of children, house price, and family costs to generate a detailed wealth projection across their entire lifespan. Other tools include a **Compound Interest Calculator**, a **Spanish Income Tax Calculator** (IRPF and social security contributions by autonomous community), a **Spanish Government Budget Analysis** tool, and a **Madrid Housing Dashboard** with municipality-level price maps, rental yield estimates, and zone filters.',
			},
			{
				heading: 'Tech stack',
				body: 'Built as a Next.js application and deployed on Vercel. Each tool is self-contained and client-side where possible for fast, privacy-preserving use.',
			},
		],
	},
	{
		slug: 'stowai',
		title: 'Stowai',
		subtitle: 'IoT monitoring for solar PV plants',
		description:
			'A startup using affordable IoT sensors and machine learning to monitor, optimize, and predict failures in solar photovoltaic plants and tracker structures.',
		tags: ['IoT', 'Machine Learning', 'Hardware', 'Solar Energy', 'Startup'],
		images: [
			'/images/projects/stowai/screenshot-1.png',
			'/images/projects/stowai/screenshot-2.png',
		],
		link: 'https://stowai.es/',
		year: 2023,
		sections: [
			{
				heading: 'What is it?',
				body: 'Stowai was a deep-tech startup with the goal of using affordable IoT sensors to monitor and optimize solar PV plant production and maintenance. The core value proposition was applying machine learning for **predictive maintenance** and mechanical failure prediction, as well as continuously assessing the **structural health of solar PV trackers** — the motorized mounting systems that follow the sun throughout the day.',
			},
			{
				heading: 'My role',
				body: 'As product manager and technical owner, I led the full development stack end-to-end: IoT sensor electronics and hardware design, embedded firmware, gateway firmware, cloud database architecture, ML algorithms for anomaly detection and predictive maintenance, and both backend and frontend software. The system processed real-time sensor data streams and surfaced actionable insights through a monitoring dashboard.',
			},
			{
				heading: 'A note on the code',
				body: 'The codebase and architecture are proprietary. Beyond what is publicly available on the Stowai website, technical details cannot be disclosed.',
			},
		],
	},
	{
		slug: 'nexgraph',
		title: 'Nexgraph',
		subtitle: 'AI-powered knowledge management',
		description:
			'An AI-powered knowledge platform that transforms audio, video, PDFs, and documents into interactive mindgraphs — automatically building semantic knowledge networks across all your sources.',
		tags: ['Next.js', 'TypeScript', 'AI', 'Knowledge Graph', 'RAG'],
		images: [
			'/images/projects/nexgraph/screenshot-1.png',
			'/images/projects/nexgraph/screenshot-2.png',
		],
		link: 'https://www.nexgraph.xyz/',
		github: 'https://github.com/zeemarquez/notes-ai',
		year: 2024,
		sections: [
			{
				heading: 'What is it?',
				body: 'Nexgraph is an AI-powered knowledge management platform that lets users transcribe and process audio, video, PDFs, and text documents into interactive **mindgraphs** — automatically extracting summaries, key points, and building semantic knowledge graphs that connect concepts across sources. Think of it as a second brain that organizes and links everything you feed it.',
			},
			{
				heading: 'Features',
				body: 'Users can add sources from local files, YouTube, Google Drive, or URLs. The app processes them with transcription and AI analysis to generate searchable summaries and structured concept hierarchies. Key features include: **RAG-powered chat** for querying your entire knowledge base in natural language, **interactive graph visualization** of relationships between concepts across sources, multi-language support, Firebase authentication with a premium tier, and sharing capabilities.',
			},
			{
				heading: 'Tech stack',
				body: 'Built with Next.js, TypeScript, and Firestore. AI processing is handled client-side and server-side via OpenAI and DeepInfra APIs. The knowledge graph is rendered as an interactive force-directed visualization.',
			},
		],
	},
	{
		slug: 'lemba',
		title: 'Lemba',
		subtitle: 'Open-source markdown editor for the AI era',
		description:
			'A modern, open-source, offline-first Markdown editor with real-time Typst PDF rendering, a WYSIWYG mode, an AI writing assistant, and an MCP server for integration with Claude, ChatGPT, and more.',
		tags: ['Next.js', 'Electron', 'Markdown', 'Typst', 'Open Source', 'MCP'],
		images: ['/images/projects/lemba/screenshot-1.png'],
		link: 'https://www.lemba.app/',
		year: 2025,
		sections: [
			{
				heading: 'What is it?',
				body: 'Lemba is a modern, open-source, offline-first Markdown editor tailored for writers, researchers, and power users. It bridges simple text layout with professional typesetting, packaged as a desktop application using Electron with a Next.js + React + Tailwind CSS frontend.',
			},
			{
				heading: 'Key features',
				body: 'Lemba features a custom Markdown engine with a fluid **dual-mode editing experience**: users can switch instantly between a distraction-free raw Markdown view and a rich, Notion-style **visual WYSIWYG editor** without context switching or lag. A defining feature is its **real-time PDF rendering engine powered by Typst**, which generates production-ready, high-fidelity documents with professional typography directly as you type. The platform also includes a built-in **Template Editor** with document variables and style-sharing, fully local file-system storage with optional encrypted cloud sync, and an **AI writing assistant** to draft, refine, and polish documents.',
			},
			{
				heading: 'MCP server',
				body: 'Lemba ships with an **MCP (Model Context Protocol) server** that lets you integrate Lemba with your favourite AI apps — Claude, Perplexity, ChatGPT, and more — to generate beautiful PDF documents from custom templates directly from within those tools.',
			},
		],
	},
	{
		slug: 'billy',
		title: 'Split Billy',
		subtitle: 'Smart bill splitting from a photo',
		description:
			'A free web app that makes splitting complex restaurant bills effortless — just scan the receipt and it handles all the calculations for large groups.',
		tags: ['Web App', 'OCR', 'Utility'],
		images: ['/images/projects/billy/screenshot-1.png'],
		year: 2024,
		sections: [
			{
				heading: 'What is it?',
				body: 'Split Billy is a free, no-login webapp that lets users split, share, and calculate complex and large bills simply by scanning a restaurant receipt. It handles the tedious maths of splitting items unevenly across a group — no more arguments about who ordered what.',
			},
			{
				heading: 'How it works',
				body: 'Point your phone at a restaurant receipt, the app reads the items automatically via OCR, and lets each person in the group claim their items. It calculates each person\'s share including tips and service charges, and shows a clear breakdown for everyone.',
			},
		],
	},
]

export function getProjectBySlug(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug)
}
