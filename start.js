import fetch from 'node-fetch';
import https from 'https';


const agent = new https.Agent({
	rejectUnauthorized: false,
});


// const URL_SERVER = 'https://70.34.210.73:9443'
const PORTAINER_SERVER = process.env.PORTAINER_SERVER_URL + '/api';
const START_PORT = parseInt(process.env.NS_START_PORT);
const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;


const getToken = async () => {
	const body = {
		password: process.env.PORTAINER_PASSWORD,
		username: process.env.PORTAINER_USER,
	}
	const tokenJson = await fetch(PORTAINER_SERVER + '/auth', {
		method: 'POST',
		headers: {
			contentType: 'application/json',
		},
		agent,
		body: JSON.stringify(body),
	})
	const token = await tokenJson.json()
	console.log('token', token)
	return token.jwt
}
const createNS = async (token, userId) => {
	const body = {
		"Hostname": "",
		"Domainname": "",
		"HostConfig": {
			"RestartPolicy": {
				"Name": "always"
			},
			"PortBindings": {
				"1337/tcp": [{
					"HostPort": (START_PORT + userId).toString()
				}]
			}
		},
		"NetworkingConfig": {
			"EndpointsConfig": {

			}
		},
		"User": "",
		"AttachStdin": false,
		"AttachStdout": true,
		"AttachStderr": true,
		"Tty": false,
		"OpenStdin": false,
		"StdinOnce": false,
		"Env": [
			"INSECURE_USE_HTTP=false",
			"NODE_ENV=production",
			"TZ=Etc/UTC",
			"INSECURE_USE_HTTP=true",
			//"MONGO_CONNECTION=mongodb://mongodb:27017/ns" + userId,
			MONGO_CONNECTION_STRING + userId + "?retryWrites=true&w=majority",
			"API_SECRET=" + NS_SECRET,
			"ENABLE=" + NS_PLUGINS,
			"AUTH_DEFAULT_ROLES=readable"
		],
		"Cmd": ["node", "lib/server/server.js"],
		"Entrypoint": "docker-entrypoint.sh",
		"Image": "nightscout/cgm-remote-monitor:latest",
		"Labels": {
			"route": "user" + userId,
			"traefik.http.routers.home.rule": "Host('70.34.210.73.localhost')&& PathPrefix('/user" + userId + "')",
		},
		"WorkingDir": "",
		"NetworkDisabled": false,

		"ExposedPorts": {
			"1337/tcp": {}
		},
		"StopSignal": "SIGTERM",
		"StopTimeout": 10
	}

	const containerIdJson = await fetch(PORTAINER_SERVER + '/endpoints/2/docker/containers/create?name=nightScout_user' + userId, {
		method: 'POST',
		headers: {
			"content-type": 'application/json',
			"Authorization": token
		},
		agent,
		body: JSON.stringify(body),

	})
	const containerId = await containerIdJson.json();
	return containerId.Id;
}
// const attachBridge = async (containerId) => {
// 	await fetch('/endpoints/2/docker/containers/' + containerId + '/start')
// }
const startNs = async (token, containerId) => {
	await fetch(PORTAINER_SERVER + '/endpoints/2/docker/containers/' + containerId + '/start', {
		method: 'POST',
		headers: {
			"content-type": 'application/json',
			"Authorization": token
		},
		agent,
	})
}

const initProfile = async (containerId) => {
	await fetch('/endpoints/2/docker/containers/' + containerId + '/start')
}


const main = async () => {
	const token = await getToken()
	for (let index = 0; index < 0; index++) {
		try {
			const containerId = await createNS(token, index);
			console.log('created ' + index, containerId)
			await startNs(token, containerId);
			console.log('started ' + index, containerId)

		} catch (error) {
			console.error('err', error)
		}
	}
}
main();