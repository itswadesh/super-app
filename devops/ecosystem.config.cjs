module.exports = {
	apps: [
		{
			name: 'dev2026:9002',
			script: 'devops/index.cjs',
			instances: 1,
			autorestart: true,
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		}
	]
}
