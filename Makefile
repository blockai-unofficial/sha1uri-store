deis-start:
	deis ps:scale web=1 --app=sha1uri-store

deis-stop:
	deis ps:scale web=0 --app=sha1uri-store
