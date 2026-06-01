export interface Project {
	title: string
	description: string
	url: string
	tags: string[]
	year?: number
}

export const projects: Project[] = [
	{
		title: 'Python FEM',
		description:
			'A 2D Finite Element Method implementation in Python for structural analysis. Solves the stress and strain distribution in arbitrary geometries using triangular elements, gmsh for meshing, and numpy for linear algebra.',
		url: 'https://github.com/zeemarquez/FEM',
		tags: ['Python', 'FEM', 'NumPy', 'Engineering'],
		year: 2022,
	},
	{
		title: 'ZCoin — Blockchain in Python',
		description:
			'A simple cryptocurrency built from scratch in Python. Implements a proof-of-work blockchain, digital signatures using elliptic curve cryptography, and transaction validation.',
		url: 'https://github.com/zeemarquez',
		tags: ['Python', 'Blockchain', 'Cryptography'],
		year: 2022,
	},
	{
		title: 'This Blog',
		description:
			'Personal portfolio and blog built with Astro, Tailwind CSS, and MDX. Features dark mode, reading time, KaTeX math rendering, and a projects showcase.',
		url: 'https://github.com/zeemarquez/blog',
		tags: ['Astro', 'TypeScript', 'Tailwind CSS'],
		year: 2024,
	},
]
