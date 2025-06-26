import shell from 'shelljs'
const PM2_NAME = 'dev2026:9002'
const REMOTE_DIR = 'D:/prod/dev-2026'
const FILE_NAMES =
	'.svelte-kit static package.json src/lib/config ecosystem.config.cjs svelte.config.js vite.config.ts'

shell
	// .exec('rm '+ REMOTE_DIR)
	// .exec('md '+ REMOTE_DIR)
	.cd('prod')
	.exec(`tar czf swadesh.tar.gz ${FILE_NAMES}`)
	.exec('rm prod -f')
	.exec(`mv swadesh.tar.gz ${REMOTE_DIR}`)
// .exec('mkdir -p ' + REMOTE_DIR)

shell
	.cd(REMOTE_DIR)
	// .exec('dir')
	.exec(`tar xf swadesh.tar.gz -C ${REMOTE_DIR}`)
	.exec('rm swadesh.tar.gz')
	// .exec('bun i')
	.exec('pm2 start ecosystem.config.cjs')
	.exec(`pm2 stop ${PM2_NAME}`)
	.exec(`pm2 start ${PM2_NAME}`)
// .exec('pm2 save')
