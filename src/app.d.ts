// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: import('./server/db/auth').SessionValidationResult['user'];
			session: import('./server/db/auth').SessionValidationResult['session']
		}
	}
}

export { };
