# Make a Storage Class
```
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  # We can use any name so long as we reference it correctly
  name: standard

  # Tell k8s this is our default storageClass
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"

# Use the EBS backend
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2

# Can also be 'Retain' but we choose delete so we don't accrue volumes during testing.
reclaimPolicy: Delete
allowVolumeExpansion: true
mountOptions:
  - debug
volumeBindingMode: Immediate
```

# Make the values file for helm
```
architecture: replicaset
replicaCount: 3
# We're testing, so 1Gi is fine
persistence:
  size: 1Gi

# Use the initContainer to change permissions for us so Mongo can write to the volume
volumePermissions.enabled: true

# Use the storageClass we created earlier
global:
  storageClass: standard

auth:
  rootPassword: secret-root-passwd

```
# add helm bitnami repo of mongodb
```
helm repo add bitnami https://charts.bitnami.com/bitnam
```
# update the repo
```
helm repo update
```

# insall the bitnami mongo
```
helm install mongodb --values Values.yml bitnami/mongodb
```

# check the monogdb cluster
```
kubectl get all
```
# exec into the pod
```
kubectl exec -it mongodb-0 mongo
```