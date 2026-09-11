import json
import urllib.request
import urllib.parse

env = {}
with open('.env.local', 'r') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k] = v.strip('"\'')

url = env.get('NEXT_PUBLIC_SUPABASE_URL') + '/rest/v1/noticias?select=id,titulo,etiquetas&etiquetas=not.cs.%7B%22SYSTEM_SLIDE%22%7D'
key = env.get('SUPABASE_SERVICE_ROLE_KEY')

req = urllib.request.Request(url)
req.add_header('apikey', key)
req.add_header('Authorization', 'Bearer ' + key)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"Total returned matching filter: {len(data)}")
        for row in data:
            print(f"ID: {row['id']} | Titulo: {row['titulo']} | Etiquetas: {row['etiquetas']}")
except Exception as e:
    print("Error:", e)
