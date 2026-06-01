import { execSync } from 'child_process'

export function remarkModifiedTime() {
	return function (tree, file) {
		const filepath = file.history[0]
		try {
			const result = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`)
			const date = result.toString().trim()
			file.data.astro.frontmatter.lastModified = date || new Date().toISOString()
		} catch {
			file.data.astro.frontmatter.lastModified = new Date().toISOString()
		}
	}
}
