// Controls what appears in the "Featured" section on the home page.
// Each entry points to either a blog post (by its slug/id, the markdown
// filename without extension) or a project (by its slug in `projects.ts`).
// Order here is the order shown on the home page.

export interface FeaturedItem {
	type: 'blog' | 'project'
	slug: string
}

export const featured: FeaturedItem[] = [
	{ type: 'blog', slug: 'solar-monte-carlo' },
	{ type: 'blog', slug: 'solar-resource-data' },
	{ type: 'blog', slug: 'solar-project-finance-model' },
	{ type: 'project', slug: 'economic-data' },
	{ type: 'project', slug: 'stowai' },
]
