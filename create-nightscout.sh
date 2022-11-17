#!/usr/bin/env bash

# TODO
# evaluate the creation of a single middleware
# can we exclude mininion from the regex?

baseurl='localhost:8008/deploy'

generate_post_data()
{
  cat<<EOF
  {
  "name":"nightscout-$1",
  "network":"traefiknet",
  "image":"nickxbs/cgm-remote-monitor:ni",
  "labels": {
    "healthcheck": "http:\/\/nightscout-$1:9000\/status",
    "traefik.enable": "true",
    "traefik.http.routers.nightscout-$1.entrypoints": "web",
	"traefik.http.services.nightscout-$1.loadbalancer.server.port": "80",    
    "traefik.http.routers.nightscout-$1.rule":  "Query(\"nightscout=$1\")",
    "traefik.http.routers.nightscout-$1.middlewares": "nightscout-$1-context",
    "traefik.http.middlewares.nightscout-$1-context.replacepathregex.regex": "^/nightscout-$1(.*)",
    "traefik.http.middlewares.nightscout-$1-context.replacepathregex.replacement": "\${1}"
  },
    "envs": {
			"INSECURE_USE_HTTP": "false",
			"NODE_ENV": "production",
			"PORT": "80",
			"TZ": "Etc/UTC",
			"INSECURE_USE_HTTP": "true",
			"MONGODB_URI": "mongodb+srv://localhost/ns$1?retryWrites=true&w=majority",
			"API_SECRET": "change_me_please",
			"ENABLE": "careportal rawbg iob",
			"AUTH_DEFAULT_ROLES": "readable"	
	}
  }
EOF
}


for i in {0..1}; do 
response=$(curl -L -s --header "Content-Type: application/json" \
     -X POST \
     --data  "$(generate_post_data $i)" \
     ${baseurl}/
   )

  if command -v jq > /dev/null 2>&1; then
    echo $response | jq
  else
    echo "Install jq for a better output"
    echo $response
  fi
done